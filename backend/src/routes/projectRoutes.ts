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

// Health check for project service
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Project service is running' });
});

// Get all projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM projects ORDER BY created_at DESC') as [any[], any];
    await connection.end();
    
    res.status(200).json({
      success: true,
      data: rows,
      message: 'Projects retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// Get project by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM projects WHERE id = ?', [id]) as [any[], any];
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0],
      message: 'Project retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// Create project
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, status = 'planning' } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    const connection = await getDbConnection();
    const [result] = await connection.execute(
      'INSERT INTO projects (name, description, status) VALUES (?, ?, ?)',
      [name, description || null, status]
    ) as [any, any];
    await connection.end();
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        description,
        status
      },
      message: 'Project created successfully'
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// Update project
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = Array.isArray(id) ? id[0] : id;
    const { name, description, status } = req.body;
    
    const connection = await getDbConnection();
    
    // Check if project exists
    const [existingProject] = await connection.execute(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    ) as [any[], any];
    
    if (existingProject.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    const project = existingProject[0];
    
    // Use existing values for fields not provided in the request
    const updatedName = name !== undefined ? name : project.name;
    const updatedDescription = description !== undefined ? description : project.description;
    const updatedStatus = status !== undefined ? status : project.status;
    
    // Validate required fields
    if (!updatedName) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    const [result] = await connection.execute(
      'UPDATE projects SET name = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedName, updatedDescription || null, updatedStatus, projectId]
    ) as [any, any];
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: parseInt(projectId),
        name: updatedName,
        description: updatedDescription,
        status: updatedStatus
      },
      message: 'Project updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = Array.isArray(id) ? id[0] : id;
    
    const connection = await getDbConnection();
    const [result] = await connection.execute('DELETE FROM projects WHERE id = ?', [projectId]) as [any, any];
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

export default router;