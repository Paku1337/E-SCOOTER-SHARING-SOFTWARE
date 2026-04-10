import pool from './db.js';
import bcrypt from 'bcryptjs';

const seedDB = async () => {
  try {
    console.log('🌱 Seeding database with test data...');

    // Create test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const servicePassword = await bcrypt.hash('service123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);

    const usersResult = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      VALUES 
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15),
        ($16, $17, $18, $19, $20)
      RETURNING id, email, role
    `, [
      'admin@fleet.com', adminPassword, 'Admin User', 'admin', 'active',
      'service1@fleet.com', servicePassword, 'Service Worker 1', 'service', 'active',
      'service2@fleet.com', servicePassword, 'Service Worker 2', 'service', 'active',
      'client@fleet.com', clientPassword, 'Client User', 'client', 'active'
    ]);

    console.log('✅ Created users:', usersResult.rows.map(u => u.email));

    // Create test spots
    const spotsResult = await pool.query(`
      INSERT INTO spots (name, description, latitude, longitude, capacity, address, area_radius, created_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16),
        ($17, $18, $19, $20, $21, $22, $23, $24),
        ($25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING id, name
    `, [
      'Central Station', 'Main parking spot near train station', 52.2297, 21.0122, 50, 'Centralna 1, Warszawa', 100, usersResult.rows[0].id,
      'Park Łazienki', 'Parking at Łazienki Park', 52.2143, 21.0280, 40, 'Al. Wśród Jezior, Warszawa', 80, usersResult.rows[0].id,
      'Shopping Mall', 'Parking at Westfield', 52.1671, 21.0803, 35, 'Aleje Jerozolimskie, Warszawa', 70, usersResult.rows[0].id,
      'Business District', 'Mirax Plaza area', 52.2229, 21.0154, 45, 'Miodowa 10, Warszawa', 90, usersResult.rows[0].id
    ]);

    console.log('✅ Created spots:', spotsResult.rows.map(s => s.name));

    // Create test scooters
    const scootersResult = await pool.query(`
      INSERT INTO scooters (device_id, name, model, serial_number, imei, battery_level, status, flespi_channel_id, latitude, longitude, current_spot_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11),
        ($12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22),
        ($23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33),
        ($34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44),
        ($45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55),
        ($56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66)
      RETURNING id, name, status
    `, [
      'SC-001', 'Scooter 001', 'OMNI OT303BL', 'SN001', '352625333222001', 85, 'available', '1001', 52.2297, 21.0122, spotsResult.rows[0].id,
      'SC-002', 'Scooter 002', 'OMNI OT303BL', 'SN002', '352625333222002', 45, 'available', '1002', 52.2143, 21.0280, spotsResult.rows[1].id,
      'SC-003', 'Scooter 003', 'OMNI OT303BL', 'SN003', '352625333222003', 95, 'in_use', '1003', 52.1671, 21.0803, spotsResult.rows[2].id,
      'SC-004', 'Scooter 004', 'OMNI OT303BL', 'SN004', '352625333222004', 20, 'charging', '1004', 52.2229, 21.0154, spotsResult.rows[3].id,
      'SC-005', 'Scooter 005', 'OMNI OT303BL', 'SN005', '352625333222005', 100, 'available', '1005', 52.2297, 21.0122, spotsResult.rows[0].id,
      'SC-006', 'Scooter 006', 'OMNI OT303BL', 'SN006', '352625333222006', 30, 'maintenance', '1006', 52.2143, 21.0280, spotsResult.rows[1].id
    ]);

    console.log('✅ Created scooters:', scootersResult.rows.map(s => s.name));

    // Create test tasks
    const tasksResult = await pool.query(`
      INSERT INTO tasks (scooter_id, task_type, status, priority, description, assigned_to, from_spot_id, to_spot_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16),
        ($17, $18, $19, $20, $21, $22, $23, $24),
        ($25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING id, task_type, status
    `, [
      scootersResult.rows[0].id, 'rebalance', 'pending', 'normal', 'Move to Park Łazienki', usersResult.rows[1].id, spotsResult.rows[0].id, spotsResult.rows[1].id,
      scootersResult.rows[1].id, 'collect', 'pending', 'high', 'Maintenance needed', usersResult.rows[1].id, spotsResult.rows[1].id, null,
      scootersResult.rows[3].id, 'collect', 'in_progress', 'normal', 'Low battery charge', usersResult.rows[2].id, spotsResult.rows[3].id, null,
      scootersResult.rows[4].id, 'deploy', 'pending', 'normal', 'Deploy to Business District', usersResult.rows[2].id, spotsResult.rows[0].id, spotsResult.rows[3].id
    ]);

    console.log('✅ Created tasks:', tasksResult.rows.map(t => `${t.task_type} (${t.status})`));

    // Create test billing records
    const billingResult = await pool.query(`
      INSERT INTO billing_records (user_id, scooter_id, amount, type, description, status, due_date)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7),
        ($8, $9, $10, $11, $12, $13, $14),
        ($15, $16, $17, $18, $19, $20, $21),
        ($22, $23, $24, $25, $26, $27, $28)
      RETURNING id, amount, status
    `, [
      usersResult.rows[3].id, scootersResult.rows[0].id, 49.99, 'rental', 'Monthly subscription', 'pending', new Date(Date.now() + 30*24*60*60*1000),
      usersResult.rows[3].id, scootersResult.rows[1].id, 19.99, 'usage', '5 rides', 'pending', new Date(Date.now() + 7*24*60*60*1000),
      usersResult.rows[3].id, scootersResult.rows[2].id, 100.00, 'damage', 'Repair cost', 'pending', new Date(Date.now() + 14*24*60*60*1000),
      usersResult.rows[3].id, scootersResult.rows[3].id, 9.99, 'membership', 'Premium membership', 'paid', new Date()
    ]);

    console.log('✅ Created billing records:', billingResult.rowCount);

    // Create test telemetry
    await pool.query(`
      INSERT INTO device_telemetry (scooter_id, latitude, longitude, battery_level, speed, distance, lock_status, movement_status, received_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9),
        ($10, $11, $12, $13, $14, $15, $16, $17, $18),
        ($19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING id
    `, [
      scootersResult.rows[0].id, 52.2297, 21.0122, 85, 0, 125.5, true, false, new Date(),
      scootersResult.rows[2].id, 52.1671, 21.0803, 45, 15.5, 2340.0, false, true, new Date(Date.now() - 5*60*1000),
      scootersResult.rows[3].id, 52.2229, 21.0154, 20, 0, 985.3, true, false, new Date(Date.now() - 10*60*1000)
    ]);

    console.log('✅ Created device telemetry');

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('  Admin: admin@fleet.com / admin123');
    console.log('  Service: service1@fleet.com / service123');
    console.log('  Client: client@fleet.com / client123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
