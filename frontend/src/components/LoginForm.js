import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  
  const { login, register, loading, error, user } = useAuth();

  // 如果用户已登录，导航到仪表板
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        if (!formData.email) {
          setFormError('注册时邮箱为必填项');
          return;
        }
        await register(formData.username, formData.email, formData.password);
      }
    } catch (err) {
      // 错误已经在AuthContext中处理
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormError('');
    setFormData({
      username: '',
      email: '',
      password: ''
    });
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h2>{isLogin ? '登录' : '注册'}</h2>
        
        {(error || formError) && (
          <div className="error-message">
            {error || formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>
        
        <div className="toggle-mode">
          {isLogin ? '还没有账户？' : '已有账户？'}
          <button 
            type="button" 
            onClick={toggleMode}
            className="toggle-button"
          >
            {isLogin ? '注册' : '登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;