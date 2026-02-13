# AI创业环境 - API使用指南

## 数据库配置

系统已成功配置为使用MySQL数据库，连接信息如下：
- 主机: 127.0.0.1
- 端口: 3306
- 数据库名: ai_company_db
- 用户名: appuser
- 密码: 123456

## 默认管理员账户

系统已创建一个默认管理员账户：
- 用户名: admin
- 密码: admin123
- 邮箱: admin@aicompany.com
- 角色: admin

## API端点

### 1. 健康检查
```
GET http://localhost:3000/health
```
返回系统状态，包括数据库和Redis连接状态。

### 2. 用户认证

#### 登录
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```
返回用户信息和JWT令牌。

#### 注册
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```
创建新用户账户。

### 3. AI角色管理

#### 获取所有AI角色
```
GET http://localhost:3000/api/characters
Authorization: Bearer <JWT_TOKEN>
```
返回系统中所有可用的AI角色。

#### 获取特定AI角色
```
GET http://localhost:3000/api/characters/:id
Authorization: Bearer <JWT_TOKEN>
```
返回指定ID的AI角色信息。

### 4. 项目管理

#### 获取所有项目
```
GET http://localhost:3000/api/projects
Authorization: Bearer <JWT_TOKEN>
```
返回当前用户的所有项目。

#### 创建新项目
```
POST http://localhost:3000/api/projects
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述",
  "budget": 10000,
  "start_date": "2026-02-12",
  "end_date": "2026-03-12"
}
```
创建一个新项目。

### 5. 决策管理

#### 获取所有决策
```
GET http://localhost:3000/api/decisions
Authorization: Bearer <JWT_TOKEN>
```
返回所有决策记录。

#### 创建新决策
```
POST http://localhost:3000/api/decisions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "决策标题",
  "description": "决策描述",
  "context": "决策背景",
  "options": [
    {"title": "选项1", "description": "选项1描述"},
    {"title": "选项2", "description": "选项2描述"}
  ],
  "project_id": 1
}
```
创建一个新决策。

## 数据库表结构

系统包含以下主要数据表：

1. **users** - 用户表
2. **ai_characters** - AI角色表（已预置5个默认角色）
3. **projects** - 项目表
4. **project_teams** - 项目团队关联表
5. **decisions** - 决策表
6. **decision_votes** - 决策投票表
7. **resources** - 资源表
8. **project_resources** - 项目资源关联表
9. **tasks** - 任务表

## 使用提示

1. 所有需要认证的API都需要在请求头中包含有效的JWT令牌：
   ```
   Authorization: Bearer <JWT_TOKEN>
   ```

2. JWT令牌在登录后获得，有效期为24小时。

3. 系统已预置了5个AI角色，可以直接用于项目：
   - Alex Chen (市场分析师)
   - Sarah Johnson (产品设计师)
   - Michael Lee (技术专家)
   - Emily Davis (项目经理)
   - David Wilson (战略顾问)

4. 服务器运行在端口3000，可以通过http://localhost:3000访问。

## 开发环境

- 后端框架: Node.js + Express
- 数据库: MySQL (Docker容器)
- 缓存: Redis (Docker容器)
- 认证: JWT
- 密码哈希: bcryptjs