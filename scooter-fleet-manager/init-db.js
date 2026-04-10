import pool from './db.js';

const initDB = async () => {
  try {
    console.log('🔧 Initializing database...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      );
    `);

    // Scooters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scooters (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(100) NOT NULL,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        imei VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        battery_level INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        speed_mode VARCHAR(20),
        total_mileage DECIMAL(10, 2) DEFAULT 0,
        current_spot_id INTEGER,
        last_update TIMESTAMP,
        flespi_channel_id VARCHAR(100),
        is_lost BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_device_id (device_id),
        INDEX idx_status (status),
        INDEX idx_battery_level (battery_level),
        INDEX idx_current_spot_id (current_spot_id)
      );
    `);

    // Spots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spots (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 10,
        current_scooters INTEGER DEFAULT 0,
        address VARCHAR(255),
        area_radius INTEGER DEFAULT 50,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_by (created_by)
      );
    `);

    // Tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        scooter_id INTEGER NOT NULL REFERENCES scooters(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        from_spot_id INTEGER REFERENCES spots(id),
        to_spot_id INTEGER REFERENCES spots(id),
        assigned_to INTEGER REFERENCES users(id),
        description TEXT,
        details JSONB,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_scooter_id (scooter_id),
        INDEX idx_status (status),
        INDEX idx_task_type (task_type),
        INDEX idx_assigned_to (assigned_to)
      );
    `);

    // Billing records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scooter_id INTEGER REFERENCES scooters(id),
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_date TIMESTAMP,
        due_date TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_type (type)
      );
    `);

    // Device telemetry table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_telemetry (
        id SERIAL PRIMARY KEY,
        scooter_id INTEGER NOT NULL REFERENCES scooters(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        battery_level INTEGER,
        speed DECIMAL(5, 2),
        distance DECIMAL(10, 2),
        lock_status BOOLEAN,
        movement_status BOOLEAN,
        raw_data JSONB,
        received_at TIMESTAMP,
        INDEX idx_scooter_id (scooter_id),
        INDEX idx_received_at (received_at)
      );
    `);

    // Audit log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        changes JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      );
    `);

    console.log('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

initDB();
