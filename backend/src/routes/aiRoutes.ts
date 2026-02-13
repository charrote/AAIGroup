import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { 
  getAIService,
  generateAIResponse, 
  generateCollaborativeResponse, 
  generateDecisionAdvice 
} from '../utils/aiServiceAdapter';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get database connection
const getDbConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'ai_company',
    password: process.env.DB_PASSWORD || 'ai_company_password',
    database: process.env.DB_NAME || 'ai_company_db',
  });
};

// Health check for AI service
router.get('/health', async (req: AuthRequest, res: Response) => {
  try {
    const aiService = getAIService();
    const status = await aiService.checkStatus();
    const config = aiService.getConfig();
    
    res.status(200).json({
      success: true,
      data: {
        ...status,
        provider: config.provider,
        model: config.model
      },
      message: 'AI service status retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error checking AI service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service status',
      error: error.message
    });
  }
});

// Update AI service configuration
router.put('/config', async (req: AuthRequest, res: Response) => {
  try {
    const { provider, apiKey, baseURL, model, timeout, maxRetries } = req.body;
    
    const aiService = getAIService();
    
    // 获取当前配置
    const currentConfig = aiService.getConfig();
    
    // 更新配置，保留API密钥（如果新的为空但旧的存在）
    const updatedConfig = {
      provider,
      baseURL,
      model,
      timeout,
      maxRetries,
      apiKey: apiKey || currentConfig.apiKey
    };
    
    // 更新配置
    aiService.updateConfig(updatedConfig);
    
    // 获取更新后的配置（不返回敏感信息如API密钥）
    const newConfig = aiService.getConfig();
    const safeConfig = {
      provider: newConfig.provider,
      baseURL: newConfig.baseURL,
      model: newConfig.model,
      timeout: newConfig.timeout,
      maxRetries: newConfig.maxRetries,
      hasApiKey: !!newConfig.apiKey
    };
    
    res.status(200).json({
      success: true,
      data: safeConfig,
      message: 'AI service configuration updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating AI service configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI service configuration',
      error: error.message
    });
  }
});

// Get current AI service configuration
router.get('/config', async (req: AuthRequest, res: Response) => {
  try {
    const aiService = getAIService();
    const config = aiService.getConfig();
    
    // 不返回敏感信息如API密钥
    const safeConfig = {
      provider: config.provider,
      baseURL: config.baseURL,
      model: config.model,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      hasApiKey: !!config.apiKey
    };
    
    res.status(200).json({
      success: true,
      data: safeConfig,
      message: 'AI service configuration retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error retrieving AI service configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI service configuration',
      error: error.message
    });
  }
});

// Generate AI response for a single character
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, characterId, customSystemPrompt, temperature } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    let characterRole = '';
    let characterPromptTemplate = '';
    
    // If characterId is provided, fetch character details
    if (characterId) {
      const connection = await getDbConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM ai_characters WHERE id = ? AND is_active = 1',
        [characterId]
      ) as [any[], any];
      await connection.end();
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'AI character not found or inactive'
        });
      }
      
      characterRole = rows[0].role;
      characterPromptTemplate = rows[0].prompt_template || '';
    }
    
    // Generate AI response
    const result = await generateAIResponse(
      prompt, 
      characterRole, 
      customSystemPrompt || characterPromptTemplate, 
      temperature
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          prompt,
          response: result.response,
          characterId: characterId || null,
          characterRole: characterRole || null
        },
        message: 'AI response generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI response',
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response',
      error: error.message
    });
  }
});

// Generate collaborative AI response for multiple characters
router.post('/collaborate', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, characterIds, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    if (!characterIds || !Array.isArray(characterIds) || characterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one character ID is required'
      });
    }
    
    // Fetch character details
    const connection = await getDbConnection();
    const placeholders = characterIds.map(() => '?').join(',');
    const [rows] = await connection.execute(
      `SELECT * FROM ai_characters WHERE id IN (${placeholders}) AND is_active = 1`,
      characterIds
    ) as [any[], any];
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active AI characters found'
      });
    }
    
    // Extract roles and prompt templates from characters
    const characterData = rows.map(character => ({
      id: character.id,
      role: character.role,
      promptTemplate: character.prompt_template || ''
    }));
    
    // Generate collaborative AI response
    const result = await generateCollaborativeResponse(prompt, characterData, context);
    
    if (result.success) {
      // Map responses back to character IDs
      const responsesWithCharacters = result.responses.map(response => {
        const character = characterData.find(c => c.role === response.role);
        return {
          characterId: character ? character.id : null,
          characterRole: response.role,
          response: response.response
        };
      });
      
      res.status(200).json({
        success: true,
        data: {
          prompt,
          context: context || null,
          responses: responsesWithCharacters
        },
        message: 'Collaborative AI response generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate collaborative AI response',
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Error generating collaborative AI response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate collaborative AI response',
      error: error.message
    });
  }
});

// Generate decision advice for a project
router.post('/decision-advice', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, decisionContext, characterIds } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    if (!decisionContext) {
      return res.status(400).json({
        success: false,
        message: 'Decision context is required'
      });
    }
    
    // Fetch project details
    const connection = await getDbConnection();
    const [projectRows] = await connection.execute(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    ) as [any[], any];
    
    if (projectRows.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const project = projectRows[0];
    
    // If characterIds are provided, use them; otherwise, use default roles
    let roles = ['市场分析师', '技术专家', '项目经理'];
    
    if (characterIds && Array.isArray(characterIds) && characterIds.length > 0) {
      const placeholders = characterIds.map(() => '?').join(',');
      const [characterRows] = await connection.execute(
        `SELECT * FROM ai_characters WHERE id IN (${placeholders}) AND is_active = 1`,
        characterIds
      ) as [any[], any];
      
      if (characterRows.length > 0) {
        roles = characterRows.map(character => character.role);
      }
    }
    
    await connection.end();
    
    // Generate decision advice
    const result = await generateDecisionAdvice(
      project.description,
      decisionContext,
      roles
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          projectId,
          projectName: project.name,
          decisionContext,
          advice: result.advice
        },
        message: 'Decision advice generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate decision advice',
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Error generating decision advice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate decision advice',
      error: error.message
    });
  }
});

// Test AI character interaction
router.post('/test-character', async (req: AuthRequest, res: Response) => {
  try {
    const { characterId, testPrompt } = req.body;
    
    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'Character ID is required'
      });
    }
    
    if (!testPrompt) {
      return res.status(400).json({
        success: false,
        message: 'Test prompt is required'
      });
    }
    
    // Fetch character details
    const connection = await getDbConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM ai_characters WHERE id = ? AND is_active = 1',
      [characterId]
    ) as [any[], any];
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI character not found or inactive'
      });
    }
    
    const character = rows[0];
    
    // Generate AI response
    const result = await generateAIResponse(
      testPrompt, 
      character.role, 
      character.prompt_template
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          character: {
            id: character.id,
            name: character.name,
            role: character.role
          },
          testPrompt,
          response: result.response
        },
        message: 'Character test completed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to test character',
        error: result.error
      });
    }
  } catch (error: any) {
    console.error('Error testing character:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test character',
      error: error.message
    });
  }
});

export default router;