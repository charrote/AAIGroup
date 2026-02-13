import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../utils/mysql';

// 扩展Request接口以包含用户信息
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// 验证JWT令牌的中间件
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET环境变量未设置');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: number };
    
    // 从数据库获取用户信息
    const [userQuery] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if ((userQuery as any[]).length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = (userQuery as any[])[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: '令牌无效' });
  }
};

// 检查用户角色的中间件
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};