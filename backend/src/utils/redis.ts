import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Add isOpen property to check connection status
let isConnected = false;

redisClient.on('connect', () => {
  isConnected = true;
});

redisClient.on('end', () => {
  isConnected = false;
});

// Override the connect method to update connection status
const originalConnect = redisClient.connect.bind(redisClient);
redisClient.connect = async () => {
  await originalConnect();
  isConnected = true;
  return redisClient;
};

// Add isOpen property
Object.defineProperty(redisClient, 'isOpen', {
  get: () => isConnected
});

export default redisClient;