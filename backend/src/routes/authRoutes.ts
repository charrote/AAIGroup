import { Router } from 'express';
import { registerUser, loginUser, getUserById } from '../utils/auth';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少为6个字符' });
    }

    // 创建用户
    const user = await registerUser(username, email, password, role);
    res.status(201).json({ 
      message: '用户注册成功',
      user
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : '注册失败' 
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码为必填项' });
    }

    // 登录用户
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(401).json({ 
      error: error instanceof Error ? error.message : '登录失败' 
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const user = await getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '获取用户信息失败' 
    });
  }
});

// Health check for auth service
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Auth service is running' });
});

export default router;