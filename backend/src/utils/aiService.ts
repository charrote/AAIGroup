import axios from 'axios';

// Ollama API配置
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

// AI角色提示模板
const AI_ROLE_PROMPTS: Record<string, { system: string; temperature: number }> = {
  '市场分析师': {
    system: '你是一名专业的市场分析师，具有敏锐的市场洞察力和数据分析能力。你的职责是分析市场趋势、竞争环境和用户需求，为项目提供市场方面的专业建议。请基于数据进行分析，给出客观、专业的意见。',
    temperature: 0.7
  },
  '产品设计师': {
    system: '你是一名富有创意的产品设计师，擅长用户体验设计和产品规划。你的职责是设计产品功能、用户界面和用户体验，确保产品既美观又实用。请从用户角度思考，注重细节和用户体验。',
    temperature: 0.8
  },
  '技术专家': {
    system: '你是一名资深技术专家，具有丰富的技术架构设计和开发经验。你的职责是评估技术可行性、设计技术架构、解决技术难题。请考虑技术选型、系统架构、性能优化和安全性等方面。',
    temperature: 0.6
  },
  '项目经理': {
    system: '你是一名经验丰富的项目经理，擅长项目规划、资源协调和进度管理。你的职责是制定项目计划、分配资源、跟踪进度，确保项目按时高质量交付。请考虑时间、成本和资源的平衡。',
    temperature: 0.5
  },
  '战略顾问': {
    system: '你是一名具有战略思维的顾问，能够从宏观角度分析问题，提供战略建议。你的职责是制定长期战略、评估商业机会、分析风险和收益。请考虑市场环境、竞争格局和公司发展方向。',
    temperature: 0.6
  }
};

// 默认提示模板（当角色不在预定义列表中时使用）
const DEFAULT_PROMPT_TEMPLATE = {
  system: '你是一名AI助手，请根据你的角色和专长，为用户提供专业、有价值的建议。',
  temperature: 0.7
};

// 检查Ollama服务状态
export const checkOllamaStatus = async (): Promise<{ status: string; message: string; models?: string[] }> => {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`);
    const models = response.data.models?.map((model: any) => model.name) || [];
    
    return {
      status: 'connected',
      message: 'Ollama服务正常',
      models
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `无法连接到Ollama服务: ${error.message}`,
      models: []
    };
  }
};

// 获取AI角色提示模板
export const getRolePrompt = (role: string): { system: string; temperature: number } => {
  return AI_ROLE_PROMPTS[role] || DEFAULT_PROMPT_TEMPLATE;
};

// 调用Ollama API生成AI响应
export const generateAIResponse = async (
  prompt: string,
  role?: string,
  customSystemPrompt?: string,
  temperature?: number
): Promise<{ success: boolean; response: string; error?: string }> => {
  try {
    // 获取角色特定的系统提示和温度
    let systemPrompt = customSystemPrompt || '你是一个有用的AI助手。';
    let temp = 0.7;
    
    if (role) {
      const roleConfig = getRolePrompt(role);
      systemPrompt = roleConfig.system;
      temp = temperature !== undefined ? temperature : roleConfig.temperature;
    } else if (temperature !== undefined) {
      temp = temperature;
    }
    
    // 构建请求体
    const requestBody = {
      model: OLLAMA_MODEL,
      system: systemPrompt,
      prompt: prompt,
      stream: false,
      options: {
        temperature: temp
      }
    };
    
    // 发送请求到Ollama API
    const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, requestBody, {
      timeout: 120000 // 120秒超时
    });
    
    if (response.data && response.data.response) {
      return {
        success: true,
        response: response.data.response.trim()
      };
    } else {
      return {
        success: false,
        response: '',
        error: 'Ollama API返回了无效的响应'
      };
    }
  } catch (error: any) {
    console.error('调用Ollama API时出错:', error);
    return {
      success: false,
      response: '',
      error: `调用Ollama API失败: ${error.message}`
    };
  }
};

// AI角色协作生成响应
export const generateCollaborativeResponse = async (
  prompt: string,
  roles: string[],
  context?: string
): Promise<{ success: boolean; responses: { role: string; response: string }[]; error?: string }> => {
  try {
    const responses: { role: string; response: string }[] = [];
    
    // 为每个角色生成响应
    for (const role of roles) {
      const rolePrompt = context 
        ? `背景信息: ${context}\n\n任务: ${prompt}\n\n请以${role}的身份，从你的专业角度回答上述任务。`
        : `请以${role}的身份，从你的专业角度回答: ${prompt}`;
      
      const result = await generateAIResponse(rolePrompt, role);
      
      if (result.success) {
        responses.push({
          role,
          response: result.response
        });
      } else {
        console.error(`${role}生成响应失败:`, result.error);
        responses.push({
          role,
          response: `抱歉，作为${role}，我无法提供响应。错误: ${result.error}`
        });
      }
    }
    
    return {
      success: true,
      responses
    };
  } catch (error: any) {
    return {
      success: false,
      responses: [],
      error: `协作生成响应失败: ${error.message}`
    };
  }
};

// 生成项目决策建议
export const generateDecisionAdvice = async (
  projectDescription: string,
  decisionContext: string,
  roles: string[] = ['市场分析师', '技术专家', '项目经理']
): Promise<{ success: boolean; advice: { role: string; advice: string }[]; error?: string }> => {
  try {
    const prompt = `项目描述: ${projectDescription}\n\n决策背景: ${decisionContext}\n\n请基于以上信息，从你的专业角度提供决策建议，包括你的观点、理由和建议的行动方案。`;
    
    const result = await generateCollaborativeResponse(prompt, roles);
    
    if (result.success) {
      const advice = result.responses.map(r => ({
        role: r.role,
        advice: r.response
      }));
      
      return {
        success: true,
        advice
      };
    } else {
      return {
        success: false,
        advice: [],
        error: result.error
      };
    }
  } catch (error: any) {
    return {
      success: false,
      advice: [],
      error: `生成决策建议失败: ${error.message}`
    };
  }
};

export default {
  checkOllamaStatus,
  getRolePrompt,
  generateAIResponse,
  generateCollaborativeResponse,
  generateDecisionAdvice
};