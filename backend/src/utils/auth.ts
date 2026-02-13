import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './mysql';

// 用户注册
export const registerUser = async (username: string, email: string, password: string, role: string = 'user') => {
  // 检查用户名是否已存在
  const [existingUsers] = await pool.execute(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (Array.isArray(existingUsers) && existingUsers.length > 0) {
    throw new Error('用户名或邮箱已存在');
  }

  // 哈希密码
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const [newUser] = await pool.execute(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, role]
  );

  // 获取创建的用户信息
  const [createdUser] = await pool.execute(
    'SELECT id, username, email, role FROM users WHERE id = ?',
    [(newUser as any).insertId]
  );

  return (createdUser as any)[0];
};

// 用户登录
export const loginUser = async (username: string, password: string) => {
  // 查找用户
  const [userQuery] = await pool.execute(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?',
    [username, username]
  );

  if (!Array.isArray(userQuery) || userQuery.length === 0) {
    throw new Error('用户名或密码错误');
  }

  const user = (userQuery as any)[0];

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('用户名或密码错误');
  }

  // 生成JWT令牌
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET环境变量未设置');
  }

  const token = jwt.sign(
    { userId: user.id },
    jwtSecret,
    { expiresIn: '24h' }
  );

  // 返回用户信息和令牌（不包含密码哈希）
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token
  };
};

// 获取用户信息
export const getUserById = async (userId: number) => {
  const [userQuery] = await pool.execute(
    'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!Array.isArray(userQuery) || userQuery.length === 0) {
    throw new Error('用户不存在');
  }

  return (userQuery as any)[0];
};