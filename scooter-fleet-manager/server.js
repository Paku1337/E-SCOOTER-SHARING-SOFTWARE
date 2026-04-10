import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import scootersRoutes from './routes/scooters.js';
import spotsRoutes from './routes/spots.js';
import tasksRoutes from './routes/tasks.js';
import billingRoutes from './routes/billing.js';
import adminRoutes from './routes/admin.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Database check
app.get('/db-health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'connected', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scooters', verifyToken, scootersRoutes);
app.use('/api/spots', verifyToken, spotsRoutes);
app.use('/api/tasks', verifyToken, tasksRoutes);
app.use('/api/billing', verifyToken, billingRoutes);
app.use('/api/admin', verifyToken, adminRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🛴 Scooter Fleet Manager running on port ${PORT}`);
});
