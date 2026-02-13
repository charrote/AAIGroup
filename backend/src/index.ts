import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database and Redis connections
import pool from './utils/mysql';
import redisClient from './utils/redis';
import initDatabase from './utils/initDatabase';

// Import routes
import aiCharacterRoutes from './routes/aiCharacterRoutes';
import projectRoutes from './routes/projectRoutes';
import decisionRoutes from './routes/decisionRoutes';
import authRoutes from './routes/authRoutes';
import aiRoutes from './routes/aiRoutes';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const [dbCheck] = await pool.execute('SELECT NOW() as currentTime');
    
    // Check Redis connection
    let redisStatus = 'disconnected';
    if (redisClient.isOpen) {
      redisStatus = 'connected';
    }
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'AI Company Backend is running',
      database: (dbCheck as any)[0].currentTime,
      redis: redisStatus
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Service is running but some components are down',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', aiCharacterRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    // Initialize Redis connection
    await redisClient.connect();
    console.log('Connected to Redis');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await redisClient.quit();
    await pool.end();
    console.log('Connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

export default app;