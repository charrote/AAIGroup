import axios from 'axios';
import fs from 'fs';
import path from 'path';

// AI服务提供商类型
export enum AIProvider {
  OLLAMA = 'ollama',
  ZHIPU = 'zhipu',
  OPENAI = 'openai',
  CUSTOM = 'custom'
}

// AI服务配置接口
export interface AIServiceConfig {
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

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

// AI服务适配器类
export class AIServiceAdapter {
  private config: AIServiceConfig;
  private configFilePath: string;
  private defaultConfig: Record<AIProvider, Partial<AIServiceConfig>> = {
    [AIProvider.OLLAMA]: {
      baseURL: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
      timeout: 120000,
      maxRetries: 2
    },
    [AIProvider.ZHIPU]: {
      baseURL: process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4',
      model: process.env.ZHIPU_MODEL || 'glm-4-flash',
      apiKey: process.env.ZHIPU_API_KEY || '',
      timeout: 60000,
      maxRetries: 3
    },
    [AIProvider.OPENAI]: {
      baseURL: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      timeout: 60000,
      maxRetries: 3
    },
    [AIProvider.CUSTOM]: {
      baseURL: process.env.CUSTOM_API_URL || '',
      model: process.env.CUSTOM_MODEL || '',
      timeout: 60000,
      maxRetries: 3
    }
  };

  constructor(config?: Partial<AIServiceConfig>) {
    // 设置配置文件路径
    this.configFilePath = path.join(process.cwd(), 'ai-config.json');
    
    // 从环境变量获取默认提供商
    const provider = (process.env.AI_PROVIDER as AIProvider) || AIProvider.OLLAMA;
    
    // 合并默认配置和用户配置
    this.config = {
      ...this.defaultConfig[provider],
      provider,
      ...config
    };
    
    // 尝试从文件加载配置
    this.loadConfigFromFile();
    
    // 验证配置
    this.validateConfig();
  }

  // 验证配置
  private validateConfig(): void {
    if (this.config.provider !== AIProvider.OLLAMA && !this.config.apiKey) {
      throw new Error(`API密钥是使用${this.config.provider}所必需的`);
    }
    
    if (!this.config.baseURL) {
      throw new Error('Base URL是必需的');
    }
    
    if (!this.config.model) {
      throw new Error('模型名称是必需的');
    }
  }

  // 获取当前配置
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
    // 保存配置到文件
    this.saveConfigToFile();
  }

  // 从文件加载配置
  private loadConfigFromFile(): void {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
        const savedConfig = JSON.parse(fileContent) as AIServiceConfig;
        
        // 合并保存的配置，但保留当前的API密钥（如果存在）
        this.config = {
          ...this.config,
          ...savedConfig,
          // 如果保存的配置中API密钥是***，则保留当前值
          apiKey: savedConfig.apiKey === '***' ? this.config.apiKey : savedConfig.apiKey
        };
      }
    } catch (error) {
      console.error('加载AI配置文件失败:', error);
    }
  }

  // 保存配置到文件
  private saveConfigToFile(): void {
    try {
      // 不保存敏感信息如API密钥到文件
      const safeConfig = {
        ...this.config,
        apiKey: this.config.apiKey ? '***' : undefined
      };
      
      fs.writeFileSync(this.configFilePath, JSON.stringify(safeConfig, null, 2));
    } catch (error) {
      console.error('保存AI配置文件失败:', error);
    }
  }

  // 获取AI角色提示模板
  getRolePrompt(role: string): { system: string; temperature: number } {
    return AI_ROLE_PROMPTS[role] || DEFAULT_PROMPT_TEMPLATE;
  }

  // 检查服务状态
  async checkStatus(): Promise<{ status: string; message: string; models?: string[] }> {
    try {
      switch (this.config.provider) {
        case AIProvider.OLLAMA:
          return await this.checkOllamaStatus();
        case AIProvider.ZHIPU:
          return await this.checkZhipuStatus();
        case AIProvider.OPENAI:
          return await this.checkOpenAIStatus();
        case AIProvider.CUSTOM:
          return await this.checkCustomStatus();
        default:
          return { status: 'error', message: '未知的AI服务提供商' };
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: `检查服务状态失败: ${error.message}`
      };
    }
  }

  // 检查Ollama状态
  private async checkOllamaStatus(): Promise<{ status: string; message: string; models?: string[] }> {
    try {
      const response = await axios.get(`${this.config.baseURL}/api/tags`);
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
  }

  // 检查智谱AI状态
  private async checkZhipuStatus(): Promise<{ status: string; message: string; models?: string[] }> {
    try {
      // 智谱AI使用chat/completions端点进行状态检查
      const testResponse = await axios.post(`${this.config.baseURL}/chat/completions`, {
        model: this.config.model || 'glm-4-flash',
        messages: [
          {
            role: 'user',
            content: '测试连接'
          }
        ],
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (testResponse.data && testResponse.data.choices && testResponse.data.choices.length > 0) {
        return {
          status: 'connected',
          message: '智谱AI服务正常',
          models: [this.config.model || 'glm-4-flash']
        };
      } else {
        return {
          status: 'error',
          message: '智谱AI API返回了无效的响应',
          models: []
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: `无法连接到智谱AI服务: ${error.message}`,
        models: []
      };
    }
  }

  // 检查OpenAI状态
  private async checkOpenAIStatus(): Promise<{ status: string; message: string; models?: string[] }> {
    try {
      const response = await axios.get(`${this.config.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      const models = response.data.data?.map((model: any) => model.id) || [];
      
      return {
        status: 'connected',
        message: 'OpenAI服务正常',
        models
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `无法连接到OpenAI服务: ${error.message}`,
        models: []
      };
    }
  }

  // 检查自定义服务状态
  private async checkCustomStatus(): Promise<{ status: string; message: string; models?: string[] }> {
    // 对于自定义服务，我们只检查基本连接
    try {
      await axios.get(`${this.config.baseURL}/health`, {
        headers: this.config.apiKey ? {
          'Authorization': `Bearer ${this.config.apiKey}`
        } : undefined,
        timeout: 5000
      });
      
      return {
        status: 'connected',
        message: '自定义AI服务正常'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `无法连接到自定义AI服务: ${error.message}`
      };
    }
  }

  // 生成AI响应
  async generateResponse(
    prompt: string,
    role?: string,
    customSystemPrompt?: string,
    temperature?: number
  ): Promise<{ success: boolean; response: string; error?: string }> {
    try {
      // 优先使用自定义系统提示（数据库中的角色提示模板）
      // 如果没有自定义提示，则使用角色特定的系统提示
      let systemPrompt = customSystemPrompt;
      let temp = 0.7;
      
      if (!systemPrompt && role) {
        // 只有在没有自定义提示时才使用预定义的角色提示
        const roleConfig = this.getRolePrompt(role);
        systemPrompt = roleConfig.system;
        temp = temperature !== undefined ? temperature : roleConfig.temperature;
      } else if (temperature !== undefined) {
        temp = temperature;
      }
      
      // 如果仍然没有系统提示，使用默认提示
      if (!systemPrompt) {
        systemPrompt = '你是一个有用的AI助手。';
      }
      
      // 根据提供商调用不同的API
      switch (this.config.provider) {
        case AIProvider.OLLAMA:
          return await this.generateOllamaResponse(prompt, systemPrompt, temp);
        case AIProvider.ZHIPU:
          return await this.generateZhipuResponse(prompt, systemPrompt, temp);
        case AIProvider.OPENAI:
          return await this.generateOpenAIResponse(prompt, systemPrompt, temp);
        case AIProvider.CUSTOM:
          return await this.generateCustomResponse(prompt, systemPrompt, temp);
        default:
          return {
            success: false,
            response: '',
            error: '未知的AI服务提供商'
          };
      }
    } catch (error: any) {
      console.error('生成AI响应时出错:', error);
      return {
        success: false,
        response: '',
        error: `生成AI响应失败: ${error.message}`
      };
    }
  }

  // 生成Ollama响应
  private async generateOllamaResponse(
    prompt: string,
    systemPrompt: string,
    temperature: number
  ): Promise<{ success: boolean; response: string; error?: string }> {
    try {
      // 增强提示，确保AI角色被正确应用
      // 将系统提示和用户提示合并，增强角色扮演效果
      const enhancedPrompt = `${systemPrompt}\n\n请严格按照上述角色设定回答以下问题，不要偏离角色定位：\n\n${prompt}`;
      
      const requestBody = {
        model: this.config.model,
        system: systemPrompt,
        prompt: enhancedPrompt,
        stream: false,
        options: {
          temperature
        }
      };
      
      const response = await axios.post(`${this.config.baseURL}/api/generate`, requestBody, {
        timeout: this.config.timeout
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
      return {
        success: false,
        response: '',
        error: `调用Ollama API失败: ${error.message}`
      };
    }
  }

  // 生成智谱AI响应
  private async generateZhipuResponse(
    prompt: string,
    systemPrompt: string,
    temperature: number
  ): Promise<{ success: boolean; response: string; error?: string }> {
    try {
      // 增强提示，确保AI角色被正确应用
      // 将系统提示和用户提示合并，增强角色扮演效果
      const enhancedPrompt = `${systemPrompt}\n\n请严格按照上述角色设定回答以下问题，不要偏离角色定位：\n\n${prompt}`;
      
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature,
        stream: false
      };
      
      const response = await axios.post(`${this.config.baseURL}/chat/completions`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return {
          success: true,
          response: response.data.choices[0].message.content.trim()
        };
      } else {
        return {
          success: false,
          response: '',
          error: '智谱AI API返回了无效的响应'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        error: `调用智谱AI API失败: ${error.message}`
      };
    }
  }

  // 生成OpenAI响应
  private async generateOpenAIResponse(
    prompt: string,
    systemPrompt: string,
    temperature: number
  ): Promise<{ success: boolean; response: string; error?: string }> {
    try {
      // 增强提示，确保AI角色被正确应用
      // 将系统提示和用户提示合并，增强角色扮演效果
      const enhancedPrompt = `${systemPrompt}\n\n请严格按照上述角色设定回答以下问题，不要偏离角色定位：\n\n${prompt}`;
      
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature,
        stream: false
      };
      
      const response = await axios.post(`${this.config.baseURL}/chat/completions`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return {
          success: true,
          response: response.data.choices[0].message.content.trim()
        };
      } else {
        return {
          success: false,
          response: '',
          error: 'OpenAI API返回了无效的响应'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        error: `调用OpenAI API失败: ${error.message}`
      };
    }
  }

  // 生成自定义服务响应
  private async generateCustomResponse(
    prompt: string,
    systemPrompt: string,
    temperature: number
  ): Promise<{ success: boolean; response: string; error?: string }> {
    try {
      // 增强提示，确保AI角色被正确应用
      // 将系统提示和用户提示合并，增强角色扮演效果
      const enhancedPrompt = `${systemPrompt}\n\n请严格按照上述角色设定回答以下问题，不要偏离角色定位：\n\n${prompt}`;
      
      // 假设自定义服务使用类似OpenAI的API格式
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature,
        stream: false
      };
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }
      
      const response = await axios.post(`${this.config.baseURL}/chat/completions`, requestBody, {
        headers,
        timeout: this.config.timeout
      });
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return {
          success: true,
          response: response.data.choices[0].message.content.trim()
        };
      } else {
        return {
          success: false,
          response: '',
          error: '自定义AI服务返回了无效的响应'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        error: `调用自定义AI服务失败: ${error.message}`
      };
    }
  }
}

// 默认AI服务实例
let defaultAIService: AIServiceAdapter;

// 获取默认AI服务实例
export function getAIService(): AIServiceAdapter {
  if (!defaultAIService) {
    defaultAIService = new AIServiceAdapter();
  }
  return defaultAIService;
}

// 设置默认AI服务实例
export function setAIService(service: AIServiceAdapter): void {
  defaultAIService = service;
}

// 创建新的AI服务实例
export function createAIService(config?: Partial<AIServiceConfig>): AIServiceAdapter {
  return new AIServiceAdapter(config);
}

// 兼容性函数，保持与旧版本的兼容
export const checkOllamaStatus = async (): Promise<{ status: string; message: string; models?: string[] }> => {
  return getAIService().checkStatus();
};

export const getRolePrompt = (role: string): { system: string; temperature: number } => {
  return getAIService().getRolePrompt(role);
};

export const generateAIResponse = async (
  prompt: string,
  role?: string,
  customSystemPrompt?: string,
  temperature?: number
): Promise<{ success: boolean; response: string; error?: string }> => {
  return getAIService().generateResponse(prompt, role, customSystemPrompt, temperature);
};

// 角色数据接口
interface CharacterData {
  id: any;
  role: string;
  promptTemplate: string;
}

export const generateCollaborativeResponse = async (
  prompt: string,
  characters: CharacterData[],
  context?: string
): Promise<{ success: boolean; responses: { role: string; response: string }[]; error?: string }> => {
  try {
    const responses: { role: string; response: string }[] = [];
    
    // 为每个角色生成响应
    for (const character of characters) {
      const rolePrompt = context 
        ? `背景信息: ${context}\n\n任务: ${prompt}\n\n请以${character.role}的身份，从你的专业角度回答上述任务。`
        : `请以${character.role}的身份，从你的专业角度回答: ${prompt}`;
      
      const result = await generateAIResponse(rolePrompt, character.role, character.promptTemplate);
      
      if (result.success) {
        responses.push({
          role: character.role,
          response: result.response
        });
      } else {
        console.error(`${character.role}生成响应失败:`, result.error);
        responses.push({
          role: character.role,
          response: `抱歉，作为${character.role}，我无法提供响应。错误: ${result.error}`
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

export const generateDecisionAdvice = async (
  projectDescription: string,
  decisionContext: string,
  roles: string[] = ['市场分析师', '技术专家', '项目经理']
): Promise<{ success: boolean; advice: { role: string; advice: string }[]; error?: string }> => {
  try {
    const prompt = `项目描述: ${projectDescription}\n\n决策背景: ${decisionContext}\n\n请基于以上信息，从你的专业角度提供决策建议，包括你的观点、理由和建议的行动方案。`;
    
    // 将角色数组转换为CharacterData数组
    const characters: CharacterData[] = roles.map(role => ({
      id: null,
      role,
      promptTemplate: ''
    }));
    
    const result = await generateCollaborativeResponse(prompt, characters);
    
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
  AIServiceAdapter,
  AIProvider,
  getAIService,
  setAIService,
  createAIService,
  checkOllamaStatus,
  getRolePrompt,
  generateAIResponse,
  generateCollaborativeResponse,
  generateDecisionAdvice
};