import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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

// Health check for AI character service
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AI Character service is running' });
});

// Get all AI characters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM ai_characters ORDER BY name') as [any[], any];
    await connection.end();
    
    res.status(200).json({
      success: true,
      data: rows,
      message: 'AI characters retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching AI characters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI characters',
      error: error.message
    });
  }
});

// Get AI character by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM ai_characters WHERE id = ?', [id]) as [any[], any];
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI character not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0],
      message: 'AI character retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching AI character:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI character',
      error: error.message
    });
  }
});

// Create AI character
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, description, personality, skills, prompt_template, is_active } = req.body;
    
    // Validate required fields
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name and role are required fields'
      });
    }
    
    const connection = await getDbConnection();
    const [result] = await connection.execute(
      'INSERT INTO ai_characters (name, role, description, personality, skills, prompt_template, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, role, description || null, personality || null, JSON.stringify(skills || []), prompt_template || null, is_active !== undefined ? is_active : true]
    ) as [any, any];
    await connection.end();
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        role,
        description,
        personality,
        skills: skills || [],
        prompt_template,
        is_active: is_active !== undefined ? is_active : true
      },
      message: 'AI character created successfully'
    });
  } catch (error: any) {
    console.error('Error creating AI character:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI character',
      error: error.message
    });
  }
});

// Update AI character
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const characterId = Array.isArray(id) ? id[0] : id;
    const { name, role, description, personality, skills, prompt_template, is_active } = req.body;
    
    const connection = await getDbConnection();
    
    // Check if character exists
    const [existingCharacter] = await connection.execute(
      'SELECT * FROM ai_characters WHERE id = ?',
      [characterId]
    ) as [any[], any];
    
    if (existingCharacter.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'AI character not found'
      });
    }
    
    const character = existingCharacter[0];
    
    // Use existing values for fields not provided in the request
    const updatedName = name !== undefined ? name : character.name;
    const updatedRole = role !== undefined ? role : character.role;
    const updatedDescription = description !== undefined ? description : character.description;
    const updatedPersonality = personality !== undefined ? personality : character.personality;
    
    // Handle skills field - it might be a JSON string or already parsed
    let updatedSkills;
    if (skills !== undefined) {
      updatedSkills = skills;
    } else {
      try {
        updatedSkills = typeof character.skills === 'string' 
          ? JSON.parse(character.skills) 
          : character.skills || [];
      } catch (e) {
        updatedSkills = [];
      }
    }
    
    const updatedPromptTemplate = prompt_template !== undefined ? prompt_template : character.prompt_template;
    const updatedIsActive = is_active !== undefined ? is_active : character.is_active;
    
    // Validate required fields
    if (!updatedName || !updatedRole) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Name and role are required fields'
      });
    }
    
    const [result] = await connection.execute(
      'UPDATE ai_characters SET name = ?, role = ?, description = ?, personality = ?, skills = ?, prompt_template = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedName, updatedRole, updatedDescription || null, updatedPersonality || null, JSON.stringify(updatedSkills || []), updatedPromptTemplate || null, updatedIsActive, characterId]
    ) as [any, any];
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI character not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: parseInt(characterId),
        name: updatedName,
        role: updatedRole,
        description: updatedDescription,
        personality: updatedPersonality,
        skills: updatedSkills,
        prompt_template: updatedPromptTemplate,
        is_active: updatedIsActive
      },
      message: 'AI character updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating AI character:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI character',
      error: error.message
    });
  }
});

// Delete AI character
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const characterId = Array.isArray(id) ? id[0] : id;
    
    const connection = await getDbConnection();
    const [result] = await connection.execute('DELETE FROM ai_characters WHERE id = ?', [characterId]) as [any, any];
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI character not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'AI character deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting AI character:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AI character',
      error: error.message
    });
  }
});

export default router;