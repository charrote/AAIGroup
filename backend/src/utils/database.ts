import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'ai_company',
  password: process.env.DB_PASSWORD || 'ai_company_password',
  database: process.env.DB_NAME || 'ai_company_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;