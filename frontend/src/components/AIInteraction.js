import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AIInteraction.css';

const AIInteraction = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState({ status: 'unknown', message: '检查中...' });
  const [activeTab, setActiveTab] = useState('single'); // single, collaborate, decision
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [collaborativeResponses, setCollaborativeResponses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [decisionContext, setDecisionContext] = useState('');
  const [decisionAdvice, setDecisionAdvice] = useState([]);
  const [error, setError] = useState('');
  const [showSingleDropdown, setShowSingleDropdown] = useState(false);
  const [showMultiDropdown, setShowMultiDropdown] = useState(false);

  // 获取认证token
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // 获取AI角色列表
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setCharacters(data.data);
        }
      } catch (error) {
        console.error('获取AI角色失败:', error);
        setError('获取AI角色失败');
      }
    };

    fetchCharacters();
  }, []);

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error('获取项目失败:', error);
        setError('获取项目失败');
      }
    };

    fetchProjects();
  }, []);

  // 检查Ollama状态
  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        const response = await fetch('/api/ai/health', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setOllamaStatus(data.data);
        }
      } catch (error) {
        console.error('检查Ollama状态失败:', error);
        setOllamaStatus({ status: 'error', message: '无法连接到Ollama服务' });
      }
    };

    checkOllamaStatus();
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSingleDropdown && !event.target.closest('.custom-dropdown')) {
        setShowSingleDropdown(false);
      }
      if (showMultiDropdown && !event.target.closest('.custom-dropdown')) {
        setShowMultiDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSingleDropdown, showMultiDropdown]);

  // 处理单个AI角色交互
  const handleSingleInteraction = async () => {
    if (!selectedCharacter || !prompt.trim()) {
      setError('请选择AI角色并输入提示');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          prompt,
          characterId: selectedCharacter
        })
      });

      const data = await response.json();
      if (data.success) {
        setResponse(data.data.response);
      } else {
        setError(data.message || '生成AI响应失败');
      }
    } catch (error) {
      console.error('AI交互失败:', error);
      setError('AI交互失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理多角色协作
  const handleCollaboration = async () => {
    if (selectedCharacters.length === 0 || !prompt.trim()) {
      setError('请选择至少一个AI角色并输入提示');
      return;
    }

    setIsLoading(true);
    setError('');
    setCollaborativeResponses([]);

    try {
      const response = await fetch('/api/ai/collaborate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          prompt,
          characterIds: selectedCharacters
        })
      });

      const data = await response.json();
      if (data.success) {
        setCollaborativeResponses(data.data.responses);
      } else {
        setError(data.message || '生成协作响应失败');
      }
    } catch (error) {
      console.error('协作交互失败:', error);
      setError('协作交互失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理决策建议
  const handleDecisionAdvice = async () => {
    if (!selectedProject || !decisionContext.trim()) {
      setError('请选择项目并输入决策背景');
      return;
    }

    setIsLoading(true);
    setError('');
    setDecisionAdvice([]);

    try {
      const response = await fetch('/api/ai/decision-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          projectId: selectedProject,
          decisionContext
        })
      });

      const data = await response.json();
      if (data.success) {
        setDecisionAdvice(data.data.advice);
      } else {
        setError(data.message || '生成决策建议失败');
      }
    } catch (error) {
      console.error('生成决策建议失败:', error);
      setError('生成决策建议失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理多选角色
  const handleCharacterSelection = (characterId) => {
    if (selectedCharacters.includes(characterId)) {
      setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
    } else {
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  };

  // 处理单角色选择
  const handleSingleCharacterSelect = (characterId) => {
    setSelectedCharacter(characterId);
    setShowSingleDropdown(false);
  };

  // 处理多角色选择
  const handleMultiCharacterSelect = (characterId) => {
    if (selectedCharacters.includes(characterId)) {
      setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
    } else {
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  };

  // 获取角色名称
  const getCharacterName = (characterId) => {
    const character = characters.find(c => c.id === characterId);
    return character ? `${character.name} (${character.role})` : '';
  };

  // 移除选中的角色
  const removeSelectedCharacter = (characterId) => {
    setSelectedCharacter(null);
  };

  // 移除选中的多角色中的一个
  const removeSelectedMultiCharacter = (characterId) => {
    setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
  };

  return (
    <div className="ai-interaction-container">
      <div className="header">
        <div className="header-left">
          <button 
            className="btn btn-secondary back-button" 
            onClick={() => navigate('/dashboard')}
          >
            ← 返回
          </button>
          <h1>角色交互测试</h1>
        </div>
      </div>
      
      {/* Ollama状态显示 */}
      <div className={`status-indicator ${ollamaStatus.status}`}>
        <h3>大模型状态: {ollamaStatus.status === 'connected' ? '已连接' : '未连接'}</h3>
        <p>{ollamaStatus.message}</p>
        {ollamaStatus.models && ollamaStatus.models.length > 0 && (
          <p>可用模型: {ollamaStatus.models.join(', ')}</p>
        )}
      </div>

      {/* 错误显示 */}
      {error && <div className="error-message">{error}</div>}

      {/* 选项卡 */}
      <div className="tabs">
        <button 
          className={activeTab === 'single' ? 'active' : ''}
          onClick={() => setActiveTab('single')}
        >
          单角色交互
        </button>
        <button 
          className={activeTab === 'collaborate' ? 'active' : ''}
          onClick={() => setActiveTab('collaborate')}
        >
          多角色协作
        </button>
        <button 
          className={activeTab === 'decision' ? 'active' : ''}
          onClick={() => setActiveTab('decision')}
        >
          决策建议
        </button>
      </div>

      {/* 单角色交互 */}
      {activeTab === 'single' && (
        <div className="interaction-panel">
          <div className="form-group">
            <label>选择:</label>
            <div className="custom-dropdown">
              <div 
                className="dropdown-selected"
                onClick={() => setShowSingleDropdown(!showSingleDropdown)}
              >
                {selectedCharacter ? (
                  <div className="selected-tag">
                    {getCharacterName(selectedCharacter)}
                    <span className="tag-remove" onClick={() => removeSelectedCharacter(selectedCharacter)}>×</span>
                  </div>
                ) : (
                  <span className="placeholder">请选择角色</span>
                )}
                <span className="dropdown-arrow">▼</span>
              </div>
              {showSingleDropdown && (
                <div className="dropdown-options">
                  {characters.map(character => (
                    <div 
                      key={character.id} 
                      className="dropdown-option"
                      onClick={() => handleSingleCharacterSelect(character.id)}
                    >
                      {character.name} ({character.role})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>输入提示:</label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入您的问题或任务..."
              rows={4}
            />
          </div>
          
          <button 
            onClick={handleSingleInteraction}
            disabled={isLoading || !selectedCharacter || !prompt.trim()}
          >
            {isLoading ? '生成中...' : '发送'}
          </button>
          
          {response && (
            <div className="response-container">
              <h3>{getCharacterName(selectedCharacter)}:</h3>
              <p>{response}</p>
            </div>
          )}
        </div>
      )}

      {/* 多角色协作 */}
      {activeTab === 'collaborate' && (
        <div className="interaction-panel">
          <div className="form-group">
            <label>选择AI角色 (可多选):</label>
            <div className="custom-dropdown">
              <div 
                className="dropdown-selected multi-select"
                onClick={() => setShowMultiDropdown(!showMultiDropdown)}
              >
                {selectedCharacters.length > 0 ? (
                  <div className="selected-tags">
                    {selectedCharacters.map(characterId => (
                      <div key={characterId} className="selected-tag">
                        {getCharacterName(characterId)}
                        <span className="tag-remove" onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedMultiCharacter(characterId);
                        }}>×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="placeholder">请选择角色</span>
                )}
                <span className="dropdown-arrow">▼</span>
              </div>
              {showMultiDropdown && (
                <div className="dropdown-options">
                  {characters.map(character => (
                    <div 
                      key={character.id} 
                      className={`dropdown-option ${selectedCharacters.includes(character.id) ? 'selected' : ''}`}
                      onClick={() => handleMultiCharacterSelect(character.id)}
                    >
                      {character.name} ({character.role})
                      {selectedCharacters.includes(character.id) && <span className="checkmark">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>输入提示:</label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入您的问题或任务..."
              rows={4}
            />
          </div>
          
          <button 
            onClick={handleCollaboration}
            disabled={isLoading || selectedCharacters.length === 0 || !prompt.trim()}
          >
            {isLoading ? '生成中...' : '发送'}
          </button>
          
          {collaborativeResponses.length > 0 && (
            <div className="responses-container">
              <h3>协作响应:</h3>
              {collaborativeResponses.map((item, index) => (
                <div key={index} className="response-item">
                  <h4>{getCharacterName(item.characterId || item.id)}:</h4>
                  <p>{item.response}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 决策建议 */}
      {activeTab === 'decision' && (
        <div className="interaction-panel">
          <div className="form-group">
            <label>选择项目:</label>
            <select 
              value={selectedProject || ''} 
              onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            >
              <option value="">请选择项目</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>决策背景:</label>
            <textarea 
              value={decisionContext} 
              onChange={(e) => setDecisionContext(e.target.value)}
              placeholder="请描述需要决策的背景和问题..."
              rows={4}
            />
          </div>
          
          <button 
            onClick={handleDecisionAdvice}
            disabled={isLoading || !selectedProject || !decisionContext.trim()}
          >
            {isLoading ? '生成中...' : '获取决策建议'}
          </button>
          
          {decisionAdvice.length > 0 && (
            <div className="responses-container">
              <h3>决策建议:</h3>
              {decisionAdvice.map((item, index) => (
                <div key={index} className="response-item">
                  <h4>{item.role}:</h4>
                  <p>{item.advice}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInteraction;