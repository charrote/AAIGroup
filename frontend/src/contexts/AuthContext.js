import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 设置axios默认headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // 初始化时检查本地存储中的token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // 当token变化时，获取用户信息
  useEffect(() => {
    if (token) {
      // 验证token有效性并获取用户信息
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  // 获取当前用户信息
  const fetchCurrentUser = async (authToken) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
      setError(null);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('token');
      setToken(null);
      setError('会话已过期，请重新登录');
    } finally {
      setLoading(false);
    }
  };

  // 登录函数
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/auth/login', { username, password });
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
    } catch (error) {
      setError(error.response?.data?.error || '登录失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 注册函数
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      await axios.post('/api/auth/register', { username, email, password });
      // 注册成功后自动登录
      await login(username, password);
    } catch (error) {
      setError(error.response?.data?.error || '注册失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setError(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 使用认证上下文的Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};