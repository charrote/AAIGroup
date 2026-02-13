# AI服务配置指南

本AI虚拟公司项目支持多种AI服务提供商，可以通过配置灵活切换不同的AI服务。目前支持以下AI服务：

1. **Ollama** (本地模型)
2. **智谱AI** (云端API)
3. **OpenAI** (云端API)
4. **自定义服务** (兼容OpenAI格式的API)

## 配置方式

### 1. 通过环境变量配置

在`.env`文件中设置以下变量：

```bash
# 设置AI服务提供商 (ollama, zhipu, openai, custom)
AI_PROVIDER=ollama

# Ollama配置
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b

# 智谱AI配置
ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_MODEL=glm-4-flash
ZHIPU_API_KEY=your_zhipu_api_key_here

# OpenAI配置
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your_openai_api_key_here

# 自定义AI服务配置
CUSTOM_API_URL=https://your-custom-api.com/v1
CUSTOM_MODEL=your_custom_model
CUSTOM_API_KEY=your_custom_api_key_here
```

### 2. 通过Web界面配置

1. 登录系统后，在Dashboard中点击"AI 服务配置"
2. 选择AI服务提供商
3. 填写相应的配置信息
4. 点击"更新配置"保存设置
5. 点击"检查状态"验证连接

## AI服务提供商详情

### Ollama (本地模型)

- **优点**：完全免费、数据隐私、离线可用
- **缺点**：需要本地硬件资源、模型性能受限
- **适用场景**：开发测试、数据敏感场景、成本敏感场景
- **配置示例**：
  ```bash
  AI_PROVIDER=ollama
  OLLAMA_API_URL=http://localhost:11434
  OLLAMA_MODEL=qwen2.5-coder:7b
  ```

### 智谱AI

- **优点**：中文优化、响应速度快、成本较低
- **缺点**：需要API密钥、数据需上传云端
- **适用场景**：中文应用、快速原型、成本敏感的生产环境
- **配置示例**：
  ```bash
  AI_PROVIDER=zhipu
  ZHIPU_API_URL=https://open.bigmodel.cn/api/paas/v4
  ZHIPU_MODEL=glm-4-flash
  ZHIPU_API_KEY=your_zhipu_api_key_here
  ```

### OpenAI

- **优点**：模型能力强、生态丰富、稳定性高
- **缺点**：成本较高、国内访问可能不稳定
- **适用场景**：高质量要求、英文应用、复杂任务
- **配置示例**：
  ```bash
  AI_PROVIDER=openai
  OPENAI_API_URL=https://api.openai.com/v1
  OPENAI_MODEL=gpt-3.5-turbo
  OPENAI_API_KEY=your_openai_api_key_here
  ```

### 自定义服务

- **优点**：完全可控、可定制化、可集成内部模型
- **缺点**：需要自行维护、开发成本高
- **适用场景**：企业内部、特殊需求、已有AI基础设施
- **配置示例**：
  ```bash
  AI_PROVIDER=custom
  CUSTOM_API_URL=https://your-custom-api.com/v1
  CUSTOM_MODEL=your_custom_model
  CUSTOM_API_KEY=your_custom_api_key_here
  ```

## 高级配置

### 超时设置

可以根据网络环境和模型复杂度调整请求超时时间：

```bash
# 在.env文件中设置
TIMEOUT=120000  # 120秒，单位毫秒
```

### 重试机制

设置请求失败时的重试次数：

```bash
# 在.env文件中设置
MAX_RETRIES=3  # 最多重试3次
```

## 切换AI服务

### 动态切换

系统支持运行时动态切换AI服务，无需重启：

1. 通过Web界面切换配置
2. 或者调用API接口：
   ```bash
   curl -X PUT http://localhost:3000/api/ai/config \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "provider": "zhipu",
       "baseURL": "https://open.bigmodel.cn/api/paas/v4",
       "model": "glm-4-flash",
       "apiKey": "your_api_key"
     }'
   ```

### 批量切换

可以通过脚本批量切换配置：

```bash
#!/bin/bash
# 切换到Ollama
curl -X PUT http://localhost:3000/api/ai/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "provider": "ollama",
    "baseURL": "http://localhost:11434",
    "model": "qwen2.5-coder:7b"
  }'

# 检查状态
curl -X GET http://localhost:3000/api/ai/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 最佳实践

1. **开发阶段**：使用Ollama本地模型，节省成本
2. **测试阶段**：使用智谱GLM-4-Flash，平衡成本和质量
3. **生产环境**：根据需求选择合适的云端服务
4. **混合使用**：不同场景使用不同的AI服务

## 故障排除

### 常见问题

1. **连接超时**
   - 检查网络连接
   - 增加超时时间
   - 确认服务地址正确

2. **认证失败**
   - 验证API密钥正确
   - 检查密钥有效期
   - 确认密钥权限

3. **模型不可用**
   - 检查模型名称拼写
   - 确认模型已安装（Ollama）
   - 验证模型支持（云端服务）

### 日志查看

查看详细日志以诊断问题：

```bash
# 查看后端日志
cd /path/to/backend
npm run dev

# 查看API调用日志
tail -f logs/api.log
```

## 安全注意事项

1. **API密钥管理**
   - 不要在代码中硬编码API密钥
   - 使用环境变量存储敏感信息
   - 定期更换API密钥

2. **数据隐私**
   - 本地模型（Ollama）数据不会离开本地
   - 云端服务数据会上传到服务商
   - 根据数据敏感度选择合适的服务

3. **访问控制**
   - 限制API配置权限
   - 使用强密码和双因素认证
   - 定期审查访问日志