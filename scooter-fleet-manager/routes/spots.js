import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all spots
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spots ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single spot with scooters
router.get('/:id', async (req, res) => {
  try {
    const spotResult = await pool.query('SELECT * FROM spots WHERE id = $1', [req.params.id]);
    if (spotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    const scootersResult = await pool.query(
      'SELECT * FROM scooters WHERE current_spot_id = $1',
      [req.params.id]
    );

    res.json({
      ...spotResult.rows[0],
      scooters: scootersResult.rows,
      scooters_count: scootersResult.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create spot
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      latitude,
      longitude,
      capacity,
      address,
      areaRadius
    } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, latitude, and longitude required' });
    }

    const result = await pool.query(
      `INSERT INTO spots (name, description, latitude, longitude, capacity, address, area_radius, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, latitude, longitude, capacity || 10, address, areaRadius || 50, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update spot
router.patch('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, capacity, address, areaRadius, status } = req.body;

    let query = 'UPDATE spots SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      query += `, name = $${paramCount++}`;
      params.push(name);
    }
    if (description !== undefined) {
      query += `, description = $${paramCount++}`;
      params.push(description);
    }
    if (capacity !== undefined) {
      query += `, capacity = $${paramCount++}`;
      params.push(capacity);
    }
    if (address !== undefined) {
      query += `, address = $${paramCount++}`;
      params.push(address);
    }
    if (areaRadius !== undefined) {
      query += `, area_radius = $${paramCount++}`;
      params.push(areaRadius);
    }
    if (status !== undefined) {
      query += `, status = $${paramCount++}`;
      params.push(status);
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    params.push(req.params.id);

    const result = await pool.query(query, params);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete spot
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    // Check if spot has scooters
    const scootersResult = await pool.query(
      'SELECT COUNT(*) FROM scooters WHERE current_spot_id = $1',
      [req.params.id]
    );

    if (parseInt(scootersResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete spot with scooters' });
    }

    await pool.query('DELETE FROM spots WHERE id = $1', [req.params.id]);
    res.json({ message: 'Spot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
