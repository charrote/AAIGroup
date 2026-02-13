import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { aiCharacterConfig } from '../config/aiCharacterConfig';
import MultiSelectDropdown from './MultiSelectDropdown';
import './AICharacterManager.css';

const AICharacterManager = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    personalities: [],
    skills: [],
    prompt_template: '',
    is_active: true
  });

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await axios.get('/api/characters');
      const data = response.data;
      
      if (data.success) {
        setCharacters(data.data);
      } else {
        setError(data.message || 'Failed to fetch characters');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 准备提交的数据，确保与后端API期望的格式一致
      const submitData = {
        name: formData.name,
        role: formData.role, // 角色是单选，直接使用
        description: formData.description,
        personality: formData.personalities.join(', '), // 将性格数组转换为字符串
        skills: formData.skills, // 技能保持数组格式，后端会将其转为JSON
        prompt_template: formData.prompt_template,
        is_active: formData.is_active
      };
      
      const url = editingCharacter 
        ? `/api/characters/${editingCharacter.id}` 
        : '/api/characters';
      const method = editingCharacter ? 'put' : 'post';
      
      const response = await axios[method](url, submitData);
      const data = response.data;
      
      if (data.success) {
        fetchCharacters();
        resetForm();
      } else {
        setError(data.message || 'Failed to save character');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  const handleEdit = (character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      role: character.role || '', // 角色是单选，直接使用
      description: character.description || '',
      personalities: character.personality ? character.personality.split(',').map(p => p.trim()) : [], // 将性格字符串转换为数组
      skills: Array.isArray(character.skills) ? character.skills : [], // 技能保持数组格式
      prompt_template: character.prompt_template || '',
      is_active: character.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this AI character?')) {
      try {
        const response = await axios.delete(`/api/characters/${id}`);
        const data = response.data;
        
        if (data.success) {
          fetchCharacters();
        } else {
          setError(data.message || 'Failed to delete character');
        }
      } catch (err) {
        setError('Error connecting to server');
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const response = await axios.put(`/api/characters/${id}`, { is_active: !currentStatus });
      const data = response.data;
      
      if (data.success) {
        fetchCharacters();
      } else {
        setError(data.message || 'Failed to update character status');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      description: '',
      personalities: [],
      skills: [],
      prompt_template: '',
      is_active: true
    });
    setEditingCharacter(null);
    setShowForm(false);
  };

  const handleQuickCreate = () => {
    // 随机选择一个角色
    const randomRole = aiCharacterConfig.roles[Math.floor(Math.random() * aiCharacterConfig.roles.length)];
    
    // 随机选择2-3个性格特质
    const shuffledPersonalities = [...aiCharacterConfig.personalities].sort(() => 0.5 - Math.random());
    const selectedPersonalities = shuffledPersonalities.slice(0, Math.floor(Math.random() * 2) + 2);
    
    // 随机选择3-5个技能
    const shuffledSkills = [...aiCharacterConfig.skills].sort(() => 0.5 - Math.random());
    const selectedSkills = shuffledSkills.slice(0, Math.floor(Math.random() * 3) + 3);
    
    // 姓氏列表（50个常见姓氏）
    const surnames = [
      '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
      '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
      '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
      '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
      '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎'
    ];
    
    // 名字列表（100个常见名字）
    const givenNames = [
      '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋',
      '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
      '平', '刚', '桂英', '玉兰', '萍', '华', '红', '建', '春', '燕',
      '琴', '志强', '建国', '建华', '文', '海峰', '秀珍', '丽华', '敏', '斌',
      '小军', '晓东', '晓丽', '晨', '晨曦', '朝阳', '宇航', '思远', '博文', '子涵',
      '欣怡', '雨欣', '雨萱', '梓涵', '晨阳', '宇航', '浩然', '思睿', '雨桐', '欣然',
      '子轩', '欣妍', '雨婷', '子墨', '雨辰', '欣悦', '思琪', '雨泽', '欣妍', '子萱',
      '宇航', '浩然', '思远', '博文', '子涵', '欣怡', '雨欣', '雨萱', '梓涵', '晨阳',
      '思睿', '雨桐', '欣然', '子轩', '欣妍', '雨婷', '子墨', '雨辰', '欣悦', '思琪',
      '雨泽', '欣妍', '子萱', '宇航', '浩然', '思远', '博文', '子涵', '欣怡', '雨欣'
    ];
    
    // 随机组合姓氏和名字
    const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
    const randomGivenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    const randomName = randomSurname + randomGivenName;
    
    // 生成描述
    const description = `AICompany的${randomRole}，具有${selectedPersonalities.join('、')}的性格特质，擅长${selectedSkills.join('、')}。`;
    
    // 生成提示词模板
    const promptTemplate = `你叫${randomName}，是${description}请根据你的专业知识和技能，为用户提供高质量的服务和建议。`;
    
    // 设置表单数据
    setFormData({
      name: randomName,
      role: randomRole,
      description: description,
      personalities: selectedPersonalities,
      skills: selectedSkills,
      prompt_template: promptTemplate,
      is_active: true
    });
    
    setShowForm(true);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="ai-character-manager">
      <div className="header">
        <div className="header-left">
          <button 
            className="btn btn-secondary back-button" 
            onClick={() => navigate('/dashboard')}
          >
            ← 返回
          </button>
          <h1>AI 角色管理</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-success quick-create-btn" 
            onClick={handleQuickCreate}
          >
            快速创建员工
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            添加新角色
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingCharacter ? 'Edit Character' : 'Add New Character'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">名称 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <MultiSelectDropdown
              options={aiCharacterConfig.roles.map(role => ({ value: role, label: role }))}
              selectedValues={formData.role ? [formData.role] : []}
              onChange={(values) => setFormData(prev => ({ ...prev, role: values[0] || '' }))}
              placeholder="选择角色..."
              label="角色 *"
              isMultiple={false}
            />

            <div className="form-group">
              <label htmlFor="description">描述</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <MultiSelectDropdown
              options={aiCharacterConfig.personalities.map(personality => ({ value: personality, label: personality }))}
              selectedValues={formData.personalities}
              onChange={(values) => setFormData(prev => ({ ...prev, personalities: values }))}
              placeholder="选择性格..."
              label="性格 (可多选)"
            />

            <MultiSelectDropdown
              options={aiCharacterConfig.skills.map(skill => ({ value: skill, label: skill }))}
              selectedValues={formData.skills}
              onChange={(values) => setFormData(prev => ({ ...prev, skills: values }))}
              placeholder="选择技能..."
              label="技能 (可多选)"
            />

            <div className="form-group">
              <label htmlFor="prompt_template">提示模板</label>
              <textarea
                id="prompt_template"
                name="prompt_template"
                value={formData.prompt_template}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <label htmlFor="is_active">是否激活</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingCharacter ? '更新' : '创建'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="characters-list">
        {characters.length === 0 ? (
          <p>暂无AI角色。创建您的第一个角色！</p>
        ) : (
          <div className="character-grid">
            {characters.map(character => (
              <div key={character.id} className={`character-card ${!character.is_active ? 'inactive' : ''}`}>
                <div className="character-header">
                  <h3>{character.name}</h3>
                  <span className="character-role">{character.role || ''}</span>
                </div>
                
                {character.description && (
                  <p className="character-description">{character.description}</p>
                )}
                
                {character.personality && (
                  <div className="character-personalities">
                    <strong>性格:</strong>
                    <div className="personalities-list">
                      {character.personality.split(',').map((personality, index) => (
                        <span key={index} className="personality-tag">{personality.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {character.skills && character.skills.length > 0 && (
                  <div className="character-skills">
                    <strong>技能:</strong>
                    <div className="skills-list">
                      {character.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="character-status">
                  状态: {character.is_active ? '激活' : '未激活'}
                </div>
                
                <div className="character-actions">
                  <button 
                    className={`btn ${character.is_active ? 'btn-warning' : 'btn-success'}`} 
                    onClick={() => handleToggleActive(character.id, character.is_active)}
                  >
                    {character.is_active ? '停用' : '激活'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleEdit(character)}
                  >
                    编辑
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(character.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AICharacterManager;