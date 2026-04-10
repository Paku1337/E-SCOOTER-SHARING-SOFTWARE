import express from 'express';
import pool from '../db.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

const VALID_TASK_TYPES = ['rebalance', 'collect', 'deploy', 'lost'];
const VALID_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled'];

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { status, type, assignedTo, scooterId } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (type) {
      query += ` AND task_type = $${params.length + 1}`;
      params.push(type);
    }
    if (assignedTo) {
      query += ` AND assigned_to = $${params.length + 1}`;
      params.push(assignedTo);
    }
    if (scooterId) {
      query += ` AND scooter_id = $${params.length + 1}`;
      params.push(scooterId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE task_type = 'rebalance') as rebalance_count,
        COUNT(*) FILTER (WHERE task_type = 'collect') as collect_count,
        COUNT(*) FILTER (WHERE task_type = 'deploy') as deploy_count,
        COUNT(*) FILTER (WHERE task_type = 'lost') as lost_count
      FROM tasks
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', requireRole(['admin', 'service']), async (req, res) => {
  try {
    const {
      scooterId,
      taskType,
      priority,
      description,
      fromSpotId,
      toSpotId,
      details
    } = req.body;

    if (!scooterId || !taskType) {
      return res.status(400).json({ error: 'Scooter ID and task type required' });
    }

    if (!VALID_TASK_TYPES.includes(taskType)) {
      return res.status(400).json({ error: `Invalid task type. Must be one of: ${VALID_TASK_TYPES.join(', ')}` });
    }

    // Verify scooter exists
    const scooterResult = await pool.query('SELECT id FROM scooters WHERE id = $1', [scooterId]);
    if (scooterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scooter not found' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (scooter_id, task_type, priority, from_spot_id, to_spot_id, description, details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [scooterId, taskType, priority || 'normal', fromSpotId || null, toSpotId || null, description, details ? JSON.stringify(details) : null, 'pending']
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, `CREATE_TASK_${taskType.toUpperCase()}`, 'task', result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign task to user
router.patch('/:id/assign', requireRole(['admin', 'service']), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify user exists
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      `UPDATE tasks 
       SET assigned_to = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [userId, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    let updateQuery = 'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status, req.params.id];
    let paramCount = 3;

    if (status === 'completed') {
      updateQuery += `, completed_at = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = $2 RETURNING *`;

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my tasks (for service workers)
router.get('/my-tasks', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.name as scooter_name, s.model 
       FROM tasks t
       LEFT JOIN scooters s ON t.scooter_id = s.id
       WHERE t.assigned_to = $1 AND t.status != 'completed'
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
