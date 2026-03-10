# ATSFlare 部署说明

本文档仅保留当前可用基线的最小部署方式，用于第三版开发前后的本地部署、联调与回归验证。

---

## 1. 前置条件

### 1.1 Server

* Go 1.18+
* Node.js 18+
* 可写 SQLite 文件目录

### 1.2 Agent

* Go 1.18+
* 对 Agent 数据目录有写权限
* 若使用独立 Nginx 模式：可执行 `nginx -t` 与 `nginx -s reload`
* 若使用 Docker 模式：具备 Docker 执行权限

---

## 2. Server 启动

### 2.1 构建前端

```bash
cd atsf_server/web
npm install
npm run build
```

### 2.2 启动服务

```bash
cd atsf_server
export SESSION_SECRET='replace-with-random-string'
export SQLITE_PATH='./atsflare.db'
go run .
```

说明：

* 默认不依赖全局 `AGENT_TOKEN`
* 节点接入凭证由数据库维护：节点专属 `agent_token` + 全局 `discovery_token`
* 默认监听端口为 `3000`

### 2.3 首次登录

访问 `http://localhost:3000`

默认账号：

* 用户名：`root`
* 密码：`123456`

---

## 3. Agent 配置

当前支持两种接入模式。

### 3.1 节点专属 `agent_token`

```json
{
  "server_url": "http://127.0.0.1:3000",
  "agent_token": "replace-with-node-auth-token",
  "data_dir": "./data",
  "nginx_container_name": "atsflare-nginx",
  "nginx_docker_image": "nginx:stable-alpine",
  "heartbeat_interval": 30000,
  "sync_interval": 30000,
  "request_timeout": 10000
}
```

### 3.2 全局 `discovery_token`

```json
{
  "server_url": "http://127.0.0.1:3000",
  "discovery_token": "replace-with-global-discovery-token",
  "data_dir": "./data",
  "nginx_container_name": "atsflare-nginx",
  "nginx_docker_image": "nginx:stable-alpine",
  "heartbeat_interval": 30000,
  "sync_interval": 30000,
  "request_timeout": 10000
}
```

说明：

* `agent_version` 由 Agent 代码内常量提供，升级时同步修改代码
* `nginx_version` 由 Agent 启动时执行命令自动探测
* 时间字段使用毫秒整数
* `agent_token` 与 `discovery_token` 至少填写一个
* 若 `agent_token` 为空且 `discovery_token` 存在，Agent 会自动注册并写回新的专属 `agent_token`
* `node_name` 与 `node_ip` 可省略，未填写时自动探测
* 未配置 `nginx_path` 时，默认使用 Docker Nginx 容器

---

## 4. Agent 启动

### 4.1 直接运行

```bash
cd atsf_agent
go run ./cmd/agent -config /path/to/agent.json
```

### 4.2 编译后二进制运行

```bash
cd atsf_agent
go build -o atsflare-agent ./cmd/agent
./atsflare-agent -config /path/to/agent.json
```

---

## 5. 最小联调步骤

### 5.1 准备节点接入

二选一：

* 在管理端预创建节点并复制专属 `agent_token`
* 在管理端查看全局 `discovery_token` 并写入节点配置

### 5.2 创建规则并发布

1. 在管理端新增一条启用中的反代规则
2. 在发布前查看预览或变更摘要
3. 生成并激活新版本

### 5.3 验证 Agent 应用

预期行为：

1. Agent 完成心跳与同步
2. 自动注册模式下完成 Token 置换
3. 拉取激活版本
4. 写入路由配置与必要证书文件
5. 执行 `nginx -t`
6. 执行 `nginx -s reload`
7. 上报应用结果

### 5.4 验证管理端状态

管理端应能看到：

* 节点在线状态
* 节点当前版本
* 最近一次应用结果
* 自动注册后节点已绑定专属 `agent_token`

### 5.5 验证失败回滚

人为制造 `nginx -t` 失败后再次发布，预期：

* Agent 回滚旧配置
* 节点 `last_error` 更新
* 应用记录中出现失败记录

---

## 6. 常用验证命令

### 6.1 Server

```bash
cd atsf_server
GOCACHE=/tmp/atsflare-go-cache go test ./...
```

### 6.2 Agent

```bash
cd atsf_agent
GOCACHE=/tmp/atsflare-go-cache go test ./...
```

### 6.3 前端

```bash
cd atsf_server/web
npm run build
```

---

## 7. 当前已知限制

* 暂未内置 systemd unit 文件
* 暂未提供一键部署脚本
* Docker 模式仍是 MVP 级封装
* 联调以手工步骤为主

---

## 8. 文档维护要求

当部署方式、配置字段、节点接入方式或联调流程变化时，同步更新本文档。
