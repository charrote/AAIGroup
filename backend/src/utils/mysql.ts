import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 创建MySQL连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'ai_company',
  password: process.env.DB_PASSWORD || 'ai_company_password',
  database: process.env.DB_NAME || 'ai_company_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// 初始化时测试连接
testConnection();

export default pool;