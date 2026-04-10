import express from 'express';
import axios from 'axios';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const FLESPI_API_BASE = 'https://flespi.io/gw/devices';
const FLESPI_TOKEN = process.env.FLESPI_TOKEN;

const normalizeFlespiDevice = (device) => {
  const channelId = device?.id ?? device?.channel_id ?? device?.flespi_channel_id ?? device?.device_id;
  const deviceId = device?.device_id ? String(device.device_id) : channelId ? String(channelId) : null;
  return {
    channelId: channelId ? String(channelId) : null,
    deviceId,
    name: device?.name || `Flespi scooter ${channelId}`,
    serialNumber: device?.serial_number || device?.imei || `FLE-${channelId}`,
    imei: device?.imei || null
  };
};

const getFlespiDevices = async () => {
  if (!FLESPI_TOKEN) return [];

  const response = await axios.get(`${FLESPI_API_BASE}?limit=100`, {
    headers: { Authorization: `FlespiToken ${FLESPI_TOKEN}` }
  });

  let devices = response.data?.result ?? response.data;
  if (devices?.items) devices = devices.items;
  if (!Array.isArray(devices)) {
    return [];
  }

  return devices.map(normalizeFlespiDevice).filter((device) => device.channelId && device.deviceId);
};

// Manual Flespi sync for admins
router.post('/sync', requireRole(['admin']), async (req, res) => {
  try {
    const inserted = await syncFlespiDevices();
    res.json({ inserted, message: `${inserted} scooters synced from Flespi` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const syncFlespiDevices = async () => {
  const devices = await getFlespiDevices();
  let inserted = 0;

  for (const device of devices) {
    try {
      const result = await pool.query(
        `INSERT INTO scooters (device_id, name, model, serial_number, imei, flespi_channel_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (device_id) DO NOTHING
         RETURNING id`,
        [device.deviceId, device.name, 'OMNI OT303BL', device.serialNumber, device.imei, device.channelId, 'available']
      );
      if (result.rowCount > 0) inserted += 1;
    } catch (error) {
      console.warn('Flespi sync insert failed:', error.message);
    }
  }

  return inserted;
};

// Get all scooters
router.get('/', async (req, res) => {
  try {
    const { status, spotId } = req.query;
    let query = 'SELECT * FROM scooters WHERE 1=1';
    const params = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (spotId) {
      query += ` AND current_spot_id = $${params.length + 1}`;
      params.push(spotId);
    }

    query += ' ORDER BY id DESC';

    let result = await pool.query(query, params);
    if (result.rows.length === 0 && FLESPI_TOKEN) {
      const inserted = await syncFlespiDevices();
      if (inserted > 0) {
        result = await pool.query(query, params);
      }
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single scooter
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scooters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scooter not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create scooter
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const {
      deviceId,
      name,
      model,
      serialNumber,
      imei,
      flespiChannelId
    } = req.body;

    const result = await pool.query(
      `INSERT INTO scooters (device_id, name, model, serial_number, imei, flespi_channel_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [deviceId, name, model, serialNumber, imei, flespiChannelId || deviceId, 'available']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scooter telemetry from Flespi
router.get('/:id/telemetry', async (req, res) => {
  try {
    const scooterResult = await pool.query(
      'SELECT flespi_channel_id FROM scooters WHERE id = $1',
      [req.params.id]
    );

    if (scooterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scooter not found' });
    }

    const channelId = scooterResult.rows[0].flespi_channel_id;

    const response = await axios.get(
      `${FLESPI_API_BASE}/${channelId}/messages?limit=1`,
      {
        headers: { Authorization: `FlespiToken ${FLESPI_TOKEN}` }
      }
    );

    res.json(response.data.result);
  } catch (error) {
    console.error('Telemetry fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// Update scooter status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'in_use', 'maintenance', 'charging', 'damaged', 'decommissioned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE scooters SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark scooter as lost
router.post('/:id/mark-lost', requireRole(['admin', 'service']), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE scooters 
       SET is_lost = true, status = 'maintenance', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'MARK_LOST', 'scooter', req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send command to scooter
router.post('/:id/command', requireRole(['admin', 'service']), async (req, res) => {
  try {
    const { instructionType, payload } = req.body;
    const scooterResult = await pool.query(
      'SELECT device_id, flespi_channel_id FROM scooters WHERE id = $1',
      [req.params.id]
    );

    if (scooterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scooter not found' });
    }

    const { device_id, flespi_channel_id } = scooterResult.rows[0];

    const commandPayload = {
      messages: [
        {
          device_id,
          instruction_type: instructionType,
          ...(payload && { payload })
        }
      ]
    };

    const response = await axios.post(
      `${FLESPI_API_BASE}/${flespi_channel_id}/commands`,
      commandPayload,
      {
        headers: { Authorization: `FlespiToken ${FLESPI_TOKEN}` }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Command error:', error.message);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

export default router;
