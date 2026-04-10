import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', requireRole(['admin']), async (req, res) => {
  try {
    const { role, status } = req.query;
    let query = 'SELECT id, email, full_name, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(role);
    }
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.patch('/users/:id/role', requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'service', 'client'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, role, full_name',
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, `CHANGE_USER_ROLE_${role.toUpperCase()}`, 'user', req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.patch('/users/:id/status', requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended', 'deleted'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, status, full_name',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs
router.get('/audit-logs', requireRole(['admin']), async (req, res) => {
  try {
    const { userId, action, limit = 50 } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }
    if (action) {
      query += ` AND action LIKE $${params.length + 1}`;
      params.push(`%${action}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system stats
router.get('/stats', requireRole(['admin']), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM users WHERE role = 'service') as service_count,
        (SELECT COUNT(*) FROM users WHERE role = 'client') as client_count,
        (SELECT COUNT(*) FROM scooters) as total_scooters,
        (SELECT COUNT(*) FROM scooters WHERE status = 'available') as available_scooters,
        (SELECT COUNT(*) FROM scooters WHERE status = 'in_use') as in_use_scooters,
        (SELECT COUNT(*) FROM scooters WHERE is_lost = true) as lost_scooters,
        (SELECT COUNT(*) FROM spots) as total_spots,
        (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as in_progress_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
        (SELECT SUM(amount) FROM billing_records WHERE status = 'pending') as pending_revenue,
        (SELECT SUM(amount) FROM billing_records WHERE status = 'paid') as paid_revenue
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
