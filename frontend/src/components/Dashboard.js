import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const navigateToCharacters = () => {
    navigate('/characters');
  };

  const navigateToAIInteraction = () => {
    navigate('/ai-interaction');
  };

  const navigateToAIConfig = () => {
    navigate('/ai-config');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI 虚拟公司管理平台</h1>
        <div className="user-info">
          <span>欢迎, {user?.username}</span>
          <button onClick={handleLogout} className="logout-button">
            退出登录
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>欢迎回来，{user?.username}!</h2>
          <p>这是您的个人仪表板，您可以在这里管理AI角色、项目和决策。</p>
        </div>
        
        <div className="feature-section">
          <h2>功能模块</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>AI 角色管理</h3>
              <p>创建和管理AI员工角色</p>
              <button className="feature-button" onClick={navigateToCharacters}>进入</button>
            </div>
            <div className="feature-card">
              <h3>AI 交互测试</h3>
              <p>测试AI角色交互和协作</p>
              <button className="feature-button" onClick={navigateToAIInteraction}>进入</button>
            </div>
            <div className="feature-card">
              <h3>AI 服务配置</h3>
              <p>配置AI服务提供商和模型</p>
              <button className="feature-button" onClick={navigateToAIConfig}>进入</button>
            </div>
            <div className="feature-card">
              <h3>项目管理</h3>
              <p>跟踪和管理公司项目</p>
              <button className="feature-button">进入</button>
            </div>
            <div className="feature-card">
              <h3>决策系统</h3>
              <p>AI辅助决策支持</p>
              <button className="feature-button">进入</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;