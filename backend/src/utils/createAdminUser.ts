import bcrypt from 'bcryptjs';
import pool from './mysql';

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    // 检查管理员用户是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      ['admin', 'admin@aicompany.com']
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    // 哈希密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // 创建管理员用户
    await pool.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@aicompany.com', passwordHash, 'admin']
    );

    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@aicompany.com');
    console.log('Role: admin');
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

export default createAdminUser;