import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL for Fly.io and managed databases
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  // Fallback to individual environment variables for local development
  pool = new pg.Pool({
    user: process.env.DB_USER || 'scooter_admin',
    password: process.env.DB_PASSWORD || 'scooter_secure_pass',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'scooter_fleet'
  });
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
