# AI虚拟公司项目（零成本版）

## 快速启动指南

### 1. 环境准备

确保已安装以下软件：
- Docker Desktop（免费）
- Node.js（免费）
- Git（免费）
- Ollama（免费）

### 2. 快速启动

#### 方式一：完整启动（需要Docker）
```bash
# 在项目根目录执行
./scripts/start.sh
```

#### 方式二：简单启动（不需要Docker）
```bash
# 在项目根目录执行
./scripts/start-simple.sh
```

这个脚本会自动：
- 检查Docker是否运行
- 检查Ollama是否安装和运行
- 下载Llama 3 8B模型（如果尚未下载）
- 启动所有Docker容器
- 检查服务健康状态
- 可选启动ngrok进行外部访问

### 3. 访问应用

启动成功后，可以通过以下地址访问：
- 前端应用: http://localhost:3001
- 后端API: http://localhost:3000
- Ollama API: http://localhost:11434

### 4. 停止服务

```bash
# 在项目根目录执行
./scripts/stop.sh
```

### 5. 开发模式

如果需要单独开发前端或后端：

```bash
# 启动数据库和Redis
docker-compose up -d postgres redis

# 启动后端（开发模式）
cd backend
npm run dev

# 启动前端（开发模式）
cd frontend
npm start
```

## 项目结构

```
AICompany/
├── docs/                    # 项目文档
├── frontend/               # 前端应用（React）
├── backend/                # 后端服务（Node.js）
├── database/               # 数据库初始化脚本
├── scripts/                # 启动和设置脚本
└── docker-compose.yml      # Docker编排配置
```

## 故障排除

### Docker相关问题
- 确保Docker Desktop已启动
- 检查端口3000、3001、5432、6379是否被占用

### Ollama相关问题
- 确保Ollama已正确安装
- 检查Llama 3 8B模型是否已下载：`ollama list`
- 手动下载模型：`ollama pull llama3:8b`

### 前端/后端问题
- 检查Node.js版本（建议18+）
- 删除node_modules重新安装：`rm -rf node_modules && npm install`

## 下一步

项目基础框架已搭建完成，接下来可以：

1. 完善AI角色系统
2. 实现项目管理功能
3. 开发决策系统
4. 添加更多AI功能

详细开发计划请参考 [实施计划.md](./docs/实施计划.md)