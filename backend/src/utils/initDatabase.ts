import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import createAdminUser from './createAdminUser';

dotenv.config();

// 创建一个不指定数据库的连接池，用于创建数据库
const adminPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 应用数据库连接池
const appPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_company_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 插入默认AI角色（仅在表为空时）
const insertDefaultAICharacters = async () => {
  try {
    console.log('Checking for default AI characters...');
    
    // 检查AI角色表是否已有数据
    const [existingCharacters] = await appPool.execute('SELECT COUNT(*) as count FROM ai_characters');
    const characterCount = (existingCharacters as any)[0].count;
    
    if (characterCount > 0) {
      console.log(`AI characters table already has ${characterCount} records, skipping default insertion`);
      return;
    }
    
    console.log('AI characters table is empty, inserting default characters...');
    
    // 插入默认AI角色
    const defaultCharacters = [
      {
        name: '艾莉',
        role: '市场分析师',
        description: '专业市场分析师，擅长市场研究和趋势分析',
        personality: '专业的，细节导向的，数据驱动的',
        skills: JSON.stringify(['市场研究', '数据分析', '趋势预测']),
        prompt_template: '您是艾莉，一位在识别市场趋势和机会方面拥有专业知识的市场分析师。始终提供数据驱动的见解，并考虑多个观点。'
      },
      {
        name: '莎拉',
        role: '产品设计师',
        description: '专业的产品设计师，关注用户体验',
        personality: '专业的，empathetic，用户中心的',
        skills: JSON.stringify(['产品设计', 'UX/UI', '原型设计']),
        prompt_template: '您是莎拉，一位专注于创建直观且用户友好解决方案的产品设计师。始终考虑最终用户体验在您的建议中。'
      },
      {
        name: '迈克尔',
        role: '技术专家',
        description: '软件架构师和技术问题解决者',
        personality: '逻辑的，系统的，解决方案导向的',
        skills: JSON.stringify(['软件架构', '系统设计', '技术问题解决']),
        prompt_template: '您是迈克尔，一位专业的技术专家，能够评估技术可行性并设计健壮的解决方案。始终考虑可扩展性和可维护性。'
      },
      {
        name: '艾米丽',
        role: '项目管理',
        description: '有经验的项目管理，组织技能',
        personality: '组织的，务实的，截止日期导向的',
        skills: JSON.stringify(['项目管理', '团队协调', '资源规划']),
        prompt_template: '您是艾米丽，一位专业的项目管理，擅长组织资源并满足截止日期。始终考虑资源限制和时间线影响。'
      },
      {
        name: '大卫',
        role: '战略顾问',
        description: '有长期愿景的业务战略家',
        personality: '战略的，前瞻性的，业务导向的',
        skills: JSON.stringify(['业务策略', '市场定位', '增长规划']),
        prompt_template: '您是大卫，一位专业的战略顾问，关注长期业务 implications。始终考虑如何决策与整体业务目标对齐。'
      }
    ];
    
    for (const character of defaultCharacters) {
      await appPool.execute(
        'INSERT INTO ai_characters (name, role, description, personality, skills, prompt_template) VALUES (?, ?, ?, ?, ?, ?)',
        [character.name, character.role, character.description, character.personality, character.skills, character.prompt_template]
      );
      console.log(`Inserted default character: ${character.name}`);
    }
    
    console.log('Default AI characters inserted successfully');
  } catch (error) {
    console.error('Error inserting default AI characters:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // 第一步：创建数据库
    console.log('Creating database if not exists...');
    const createDbPath = path.join(__dirname, '../../../database/init/00-create-database.sql');
    const createDbSql = fs.readFileSync(createDbPath, 'utf8');
    
    // 分割SQL语句
    const createDbStatements = createDbSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    // 执行创建数据库的语句
    for (const statement of createDbStatements) {
      if (statement.trim()) {
        try {
          await adminPool.execute(statement);
          console.log('Executed:', statement.substring(0, 50) + '...');
        } catch (error: any) {
          console.error('Error executing statement:', error.message);
          console.error('Statement:', statement);
        }
      }
    }
    
    // 第二步：创建表
    console.log('Creating tables...');
    const sqlPath = path.join(__dirname, '../../../database/init/01-init-mysql.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割SQL语句
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await appPool.execute(statement);
          console.log('Executed:', statement.substring(0, 50) + '...');
        } catch (error: any) {
          // 忽略表已存在的错误
          if (!error.message.includes('already exists')) {
            console.error('Error executing statement:', error.message);
            console.error('Statement:', statement);
          }
        }
      }
    }
    
    // 关闭管理员连接池
    await adminPool.end();
    
    // 创建管理员用户
    await createAdminUser();
    
    // 检查并插入默认AI角色（仅在表为空时）
    await insertDefaultAICharacters();
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export default initDatabase;