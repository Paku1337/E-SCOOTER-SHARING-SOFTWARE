import pool from './db.js';

const resetDB = async () => {
  try {
    console.log('🔄 Resetting database...');

    // Drop all tables
    await pool.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS device_telemetry CASCADE;
      DROP TABLE IF EXISTS billing_records CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS spots CASCADE;
      DROP TABLE IF EXISTS scooters CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('✅ All tables dropped');

    // Re-create tables using init-db logic
    // Users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_email ON users(email);
      CREATE INDEX idx_role ON users(role);
    `);

    // Scooters table
    await pool.query(`
      CREATE TABLE scooters (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_device_id ON scooters(device_id);
      CREATE INDEX idx_status ON scooters(status);
      CREATE INDEX idx_battery_level ON scooters(battery_level);
      CREATE INDEX idx_current_spot_id ON scooters(current_spot_id);
    `);

    // Spots table
    await pool.query(`
      CREATE TABLE spots (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_status ON spots(status);
      CREATE INDEX idx_created_by ON spots(created_by);
    `);

    // Tasks table
    await pool.query(`
      CREATE TABLE tasks (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_scooter_id ON tasks(scooter_id);
      CREATE INDEX idx_status ON tasks(status);
      CREATE INDEX idx_task_type ON tasks(task_type);
      CREATE INDEX idx_assigned_to ON tasks(assigned_to);
    `);

    // Billing records table
    await pool.query(`
      CREATE TABLE billing_records (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_user_id ON billing_records(user_id);
      CREATE INDEX idx_status ON billing_records(status);
      CREATE INDEX idx_type ON billing_records(type);
    `);

    // Device telemetry table
    await pool.query(`
      CREATE TABLE device_telemetry (
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
        received_at TIMESTAMP
      );
      CREATE INDEX idx_scooter_id ON device_telemetry(scooter_id);
      CREATE INDEX idx_received_at ON device_telemetry(received_at);
    `);

    // Audit log table
    await pool.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        changes JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_user_id ON audit_logs(user_id);
      CREATE INDEX idx_created_at ON audit_logs(created_at);
    `);

    console.log('✅ Database reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset error:', error);
    process.exit(1);
  }
};

resetDB();
