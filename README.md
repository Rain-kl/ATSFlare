# ATSFlare

ATSFlare 是一个面向内部使用的 Nginx 反向代理控制面 MVP。

当前版本只覆盖以下闭环：

- 管理端维护反代规则
- Server 生成并激活配置版本
- Agent 拉取激活版本并写入独立 Nginx 路由配置文件
- Agent 执行 `nginx -t` 和 `nginx -s reload`
- Server 展示节点状态和最近一次应用结果

不包含多租户、WAF、限流、Redis、对象存储、复杂缓存策略等平台化能力。

## 仓库结构

- `atsf_server`: Gin + GORM + SQLite 的控制中心，包含管理端 API、Agent API 和 Web 管理台
- `atsf_agent`: Go 单体 Agent，负责注册、心跳、同步配置、写入 Nginx 路由文件并 reload
- `docs`: 设计、开发规范、开发计划和部署联调文档

接手前请先阅读：

1. [docs/design.md](/Users/ryan/DEV/Go/ATSFlare/docs/design.md)
2. [docs/development-guidelines.md](/Users/ryan/DEV/Go/ATSFlare/docs/development-guidelines.md)
3. [docs/development-plan.md](/Users/ryan/DEV/Go/ATSFlare/docs/development-plan.md)

## 当前功能状态

- Phase 1: Server 数据层与发布闭环，已完成
- Phase 2: Agent API 与节点状态，已完成
- Phase 3: Agent 本体最小闭环，已完成
- Phase 4: 管理端页面，已完成
- Phase 5: 部署与联调文档，已完成

## 快速开始

最小运行步骤见：

- [docs/deployment.md](/Users/ryan/DEV/Go/ATSFlare/docs/deployment.md)

如果只想快速验证测试：

```bash
cd atsf_server && GOCACHE=/tmp/atsflare-go-cache go test ./...
cd atsf_agent && GOCACHE=/tmp/atsflare-go-cache go test ./...
cd atsf_server/web && npm run build
```

## 默认约束

- Server 默认使用 SQLite
- 不配置 `REDIS_CONN_STRING`
- Agent 鉴权使用 `X-Agent-Token`
- 第一版只管理独立生成的 Nginx 路由配置文件

## 后续工作

当前 MVP 已可支撑最小闭环。下一阶段优先项通常包括：

- 补充 systemd 服务示例
- 增加真实环境联调记录
- 优化前端交互和表单校验
- 增加更多 Agent 侧集成测试
