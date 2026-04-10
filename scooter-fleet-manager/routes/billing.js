import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get billing records
router.get('/', async (req, res) => {
  try {
    const { userId, status, type } = req.query;
    let query = 'SELECT * FROM billing_records WHERE 1=1';
    const params = [];

    // Non-admins can only see their own records
    if (req.user.role === 'client') {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(req.user.id);
    } else if (userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get billing summary
router.get('/summary/user/:userId', async (req, res) => {
  try {
    // Check permissions
    if (req.user.role === 'client' && req.user.id !== parseInt(req.params.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
        SUM(amount) FILTER (WHERE status = 'pending') as total_pending,
        SUM(amount) FILTER (WHERE status = 'paid') as total_paid,
        SUM(amount) as total_amount
      FROM billing_records
      WHERE user_id = $1`,
      [req.params.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create billing record
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const {
      userId,
      scooterId,
      amount,
      type,
      description,
      dueDate,
      metadata
    } = req.body;

    if (!userId || !amount || !type) {
      return res.status(400).json({ error: 'User ID, amount, and type required' });
    }

    const result = await pool.query(
      `INSERT INTO billing_records (user_id, scooter_id, amount, type, description, due_date, metadata, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, scooterId || null, amount, type, description, dueDate || null, metadata ? JSON.stringify(metadata) : null, 'pending']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as paid
router.patch('/:id/mark-paid', async (req, res) => {
  try {
    const recordResult = await pool.query('SELECT * FROM billing_records WHERE id = $1', [req.params.id]);

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = recordResult.rows[0];

    // Check permissions
    if (req.user.role === 'client' && record.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `UPDATE billing_records 
       SET status = 'paid', payment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'MARK_PAID', 'billing_record', req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get billing statistics
router.get('/stats/dashboard', requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_records,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_records,
        SUM(amount) FILTER (WHERE status = 'pending') as total_pending_amount,
        SUM(amount) FILTER (WHERE status = 'paid') as total_paid_amount,
        AVG(amount) as average_amount,
        COUNT(DISTINCT user_id) as unique_users
      FROM billing_records
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
