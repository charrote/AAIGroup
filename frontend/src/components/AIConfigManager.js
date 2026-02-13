import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AIConfigManager.css';

const AIConfigManager = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    provider: 'ollama',
    baseURL: '',
    model: '',
    apiKey: '',
    timeout: 60000,
    maxRetries: 3
  });
  
  const [status, setStatus] = useState({ status: 'unknown', message: '检查中...', models: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 获取认证token
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // 获取当前配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/ai/config', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        const data = await response.json();
        if (data.success) {
          // 如果有API密钥标记，但实际值为空，保留空值（不显示实际密钥）
          setConfig({
            ...data.data,
            apiKey: data.data.hasApiKey ? '已保存' : ''
          });
        }
      } catch (error) {
        console.error('获取配置失败:', error);
        setError('获取配置失败');
      }
    };

    fetchConfig();
    // 页面加载时自动检查服务状态
    checkStatus();
  }, []);

  // 检查服务状态
  const checkStatus = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/health', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStatus({
          status: data.data.status,
          message: data.data.message,
          models: data.data.models || []
        });
      } else {
        setError(data.message || '检查服务状态失败');
      }
    } catch (error) {
      console.error('检查服务状态失败:', error);
      setError('检查服务状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新配置
  const updateConfig = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 如果API密钥是"已保存"，则不发送它（保留服务器上的值）
      const configToUpdate = {
        ...config,
        apiKey: config.apiKey === '已保存' ? undefined : config.apiKey
      };
      
      const response = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(configToUpdate)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('配置更新成功');
        // 更新本地配置
        setConfig({
          ...data.data,
          apiKey: data.data.hasApiKey ? '已保存' : ''
        });
        // 更新状态
        checkStatus();
      } else {
        setError(data.message || '配置更新失败');
      }
    } catch (error) {
      console.error('配置更新失败:', error);
      setError('配置更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'timeout' || name === 'maxRetries' ? parseInt(value) : value
    }));
  };

  // 处理提供商变化
  const handleProviderChange = (e) => {
    const provider = e.target.value;
    let newConfig = { ...config, provider };
    
    // 根据提供商设置默认值
    switch (provider) {
      case 'ollama':
        newConfig.baseURL = 'http://localhost:11434';
        newConfig.model = 'qwen2.5-coder:7b';
        newConfig.timeout = 120000;
        break;
      case 'zhipu':
        newConfig.baseURL = 'https://open.bigmodel.cn/api/paas/v4';
        newConfig.model = 'glm-4-flash';
        newConfig.timeout = 60000;
        break;
      case 'openai':
        newConfig.baseURL = 'https://api.openai.com/v1';
        newConfig.model = 'gpt-3.5-turbo';
        newConfig.timeout = 60000;
        break;
      case 'custom':
        newConfig.baseURL = '';
        newConfig.model = '';
        newConfig.timeout = 60000;
        break;
    }
    
    setConfig(newConfig);
  };

  return (
    <div className="ai-config-container">
      <div className="header">
        <div className="header-left">
          <button 
            className="btn btn-secondary back-button" 
            onClick={() => navigate('/dashboard')}
          >
            ← 返回
          </button>
          <h1>AI 服务配置</h1>
        </div>
      </div>
      
      {/* 错误和成功消息 */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* 服务状态 */}
      <div className="status-section">
        <h2>服务状态</h2>
        <div className={`status-indicator ${status.status}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {status.status === 'connected' ? '已连接' : 
             status.status === 'error' ? '连接错误' : '未知状态'}
          </span>
          <span className="status-message">{status.message}</span>
        </div>
        <button 
          onClick={checkStatus}
          disabled={isLoading}
          className="check-status-btn"
        >
          {isLoading ? '检查中...' : '检查状态'}
        </button>
        
        {status.models && status.models.length > 0 && (
          <div className="models-section">
            <h3>可用模型:</h3>
            <div className="models-list">
              {status.models.map((model, index) => (
                <div key={index} className="model-item">{model}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 配置表单 */}
      <div className="config-section">
        <h2>配置设置</h2>
        <div className="config-form">
          <div className="form-group">
            <label htmlFor="provider">AI服务提供商:</label>
            <select 
              id="provider" 
              name="provider" 
              value={config.provider} 
              onChange={handleProviderChange}
            >
              <option value="ollama">Ollama (本地)</option>
              <option value="zhipu">智谱AI</option>
              <option value="openai">OpenAI</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="baseURL">API地址:</label>
            <input 
              type="text" 
              id="baseURL" 
              name="baseURL" 
              value={config.baseURL} 
              onChange={handleChange}
              placeholder="例如: http://localhost:11434 或 https://api.openai.com/v1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="model">模型名称:</label>
            <input 
              type="text" 
              id="model" 
              name="model" 
              value={config.model} 
              onChange={handleChange}
              placeholder="例如: qwen2.5-coder:7b 或 gpt-3.5-turbo"
            />
          </div>
          
          {config.provider !== 'ollama' && (
            <div className="form-group">
              <label htmlFor="apiKey">API密钥:</label>
              <input 
                type="password" 
                id="apiKey" 
                name="apiKey" 
                value={config.apiKey} 
                onChange={handleChange}
                placeholder="请输入API密钥"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="timeout">超时时间 (毫秒):</label>
            <input 
              type="number" 
              id="timeout" 
              name="timeout" 
              value={config.timeout} 
              onChange={handleChange}
              min="1000"
              max="300000"
              step="1000"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="maxRetries">最大重试次数:</label>
            <input 
              type="number" 
              id="maxRetries" 
              name="maxRetries" 
              value={config.maxRetries} 
              onChange={handleChange}
              min="0"
              max="10"
            />
          </div>
          
          <button 
            onClick={updateConfig}
            disabled={isLoading}
            className="update-config-btn"
          >
            {isLoading ? '更新中...' : '更新配置'}
          </button>
        </div>
      </div>
      
      {/* 预设配置 */}
      <div className="presets-section">
        <h2>预设配置</h2>
        <div className="presets-grid">
          <div 
            className="preset-card"
            onClick={() => {
              setConfig({
                provider: 'ollama',
                baseURL: 'http://localhost:11434',
                model: 'qwen2.5-coder:7b',
                apiKey: '',
                timeout: 120000,
                maxRetries: 2
              });
            }}
          >
            <h3>本地Ollama</h3>
            <p>使用本地Ollama服务，零成本运行</p>
          </div>
          
          <div 
            className="preset-card"
            onClick={() => {
              setConfig({
                provider: 'zhipu',
                baseURL: 'https://open.bigmodel.cn/api/paas/v4',
                model: 'glm-4-flash',
                apiKey: '',
                timeout: 60000,
                maxRetries: 3
              });
            }}
          >
            <h3>智谱AI</h3>
            <p>使用智谱GLM-4-Flash模型，快速响应</p>
          </div>
          
          <div 
            className="preset-card"
            onClick={() => {
              setConfig({
                provider: 'openai',
                baseURL: 'https://api.openai.com/v1',
                model: 'gpt-3.5-turbo',
                apiKey: '',
                timeout: 60000,
                maxRetries: 3
              });
            }}
          >
            <h3>OpenAI</h3>
            <p>使用OpenAI GPT-3.5-Turbo模型</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigManager;