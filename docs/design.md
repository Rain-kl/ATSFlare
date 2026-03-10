# ATSFlare 设计基线（V3 准备版）

## 1. 文档目的

本文档不再展开记录第一版、第二版的实施过程，只保留当前系统边界、稳定约束与第三版开始前必须确认的设计输入。

当前结论：

* 第一版、第二版已完成并进入归档状态
* 当前代码库的可运行能力，以本文档为唯一设计基线
* 第三版开发前，如需扩展系统边界，先更新本文档，再开始编码

---

## 2. 当前产品定位

ATSFlare 当前仍定位为**内部自用的反向代理控制面**，不是面向外部租户的 CDN SaaS。

当前已经具备的核心能力：

* 反代规则管理
* 配置渲染、发布、激活与回滚
* Agent 心跳、同步、应用结果上报
* Nginx 配置写入、校验、reload 与失败回滚
* HTTPS/TLS 路由支持
* 证书托管与域名管理
* 节点预创建、节点专属 `agent_token`、全局 `discovery_token`
* 配置预览与变更摘要

当前默认工作方式：

* 所有节点消费同一份全局激活版本
* 控制面保存状态与配置，不直接 SSH 管理机器
* Agent 是节点侧唯一落地入口

---

## 3. 明确保持不做的范围

在第三版目标明确前，以下内容仍视为范围外：

* 多租户
* WAF、限流、Bot、防刷
* 节点分组、差异化下发、灰度百分比发布
* Redis、消息队列、对象存储、Prometheus
* 复杂缓存策略、分层缓存、mid-tier
* 证书自动签发与自动续期
* 审批流、审计中台、Purge 平台化能力
* 抽象 `zone`、`origin_pool`、`policy`、`deployment` 等平台对象

如果第三版需要引入以上任一能力，必须先补设计，再进入实现。

---

## 4. 技术基线

### 4.1 Server

基于 `atsf_server` 单体应用继续演进：

* Web 框架：Gin
* ORM：GORM
* 数据库：SQLite
* 管理端前端：`atsf_server/web`
* 用户鉴权：沿用现有 ATSFlare 登录体系

默认不以新基础设施为前提：

* 不依赖 Redis
* 不依赖 MQ
* 不依赖外部对象存储

### 4.2 Agent

基于 `atsf_agent` Go 单体程序继续演进：

* 单二进制
* 节点本地执行
* 优先使用独立 Nginx
* 显式配置 `nginx_path` 时直接调用该路径
* 未配置 `nginx_path` 时默认使用 Docker Nginx 容器
* 生成资源默认落在 `./data`，可由 `data_dir` 覆盖

### 4.3 Nginx 管理边界

控制面当前只管理以下内容：

* 反向代理路由配置
* 控制面托管证书对应的本地证书文件

仍不管理以下内容：

* `nginx.conf`
* upstream 高级编排
* 复杂缓存策略
* 节点级系统运维逻辑

---

## 5. 当前总体架构

```text
ATSFlare Server (Gin + SQLite + Web UI)
        |
        | HTTP API / Config Pull
        v
ATSFlare Agent (heartbeat / sync / apply / report)
        |
        v
   Local Nginx or Docker Nginx
        |
        v
      Origin
```

设计原则保持不变：

* Server 负责配置、版本、节点状态
* Agent 负责本地落盘、校验、reload、回滚
* 发布通过“生成新版本并激活”完成
* 历史版本不可变

---

## 6. 核心对象

### 6.1 `proxy_routes`

表示一条 `domain -> origin_url` 的反向代理规则。

关键字段：

* `domain`
* `origin_url`
* `enabled`
* `enable_https`
* `cert_id`
* `redirect_http`
* `custom_headers`
* `remark`

约束：

* 一个域名只对应一个源站
* `domain` 必须唯一
* `origin_url` 必须是合法的 `http://` 或 `https://`

### 6.2 `config_versions`

表示一次完整发布快照。

关键字段：

* `version`
* `snapshot_json`
* `rendered_config`
* `checksum`
* `is_active`
* `created_by`

约束：

* 每个版本保存完整快照与渲染结果
* 全局同时只能有一个激活版本
* 回滚通过重新激活旧版本实现

### 6.3 `nodes`

表示节点运行状态与接入凭证。

关键字段：

* `node_id`
* `name`
* `ip`
* `status`
* `current_version`
* `last_seen_at`
* `last_error`
* `agent_token`

约束：

* 节点专属 `agent_token` 由 Server 生成并持久化
* 删除节点后，其凭证必须立即失效
* 全局 `discovery_token` 不存放在 `nodes` 表中

### 6.4 `apply_logs`

记录节点应用版本的结果。

关键字段：

* `node_id`
* `version`
* `result`
* `message`
* `created_at`

### 6.5 `tls_certificates`

表示控制面托管的证书与私钥。

关键字段：

* `name`
* `cert_pem`
* `key_pem`
* `not_before`
* `not_after`
* `remark`

### 6.6 `managed_domains`

表示域名资产及其默认证书关系。

关键字段：

* `domain`
* `cert_id`
* `enabled`
* `remark`

约束：

* 支持精确域名与 `*.example.com` 通配符域名
* 证书匹配同时支持精确匹配与通配符匹配

---

## 7. 当前发布模型

标准链路：

```text
修改规则 -> 预览/查看 diff -> 发布 -> 生成完整配置版本 -> 激活版本 -> Agent 拉取 -> 本地应用 -> 上报结果
```

发布规则：

1. 读取全部启用的 `proxy_routes`
2. 渲染完整 Nginx 配置
3. 计算 `checksum`
4. 写入 `config_versions`
5. 切换激活版本
6. Agent 在下一轮同步中发现并应用

版本规则：

* 版本号格式：`YYYYMMDD-NNN`
* 版本不可变
* 节点只拉取当前激活版本

---

## 8. 当前模块边界

### 8.1 `atsf_server`

负责：

* 管理端 UI 与 API
* Agent API
* 数据存储
* 配置渲染
* 发布与激活
* 节点状态展示

### 8.2 `atsf_agent`

负责：

* 首次注册与凭证置换
* 周期性心跳
* 拉取激活版本
* 写入本地路由与证书文件
* 执行 `nginx -t` / `nginx -s reload`
* 失败回滚
* 上报应用结果

### 8.3 `atsf_server/web`

负责：

* 规则、版本、节点、应用记录页面
* 证书与域名管理页面
* 发布前预览与变更摘要展示

---

## 9. 当前接口域

为控制文档长度，仅保留接口域，不再逐条展开历史接口清单。

管理端接口当前覆盖：

* `proxy-routes`
* `config-versions`
* `nodes`
* `apply-logs`
* `tls-certificates`
* `managed-domains`

Agent 接口当前覆盖：

* 注册
* 心跳
* 获取激活版本
* 上报应用结果

统一约束：

* 管理端与 Agent API 均使用 JSON
* Agent API 固定放在 `/api/agent/*`
* Agent 鉴权使用 `X-Agent-Token`


## 10. 文档策略

第一版、第二版的详细实施过程不再在本文档中长期保留。

后续原则：

* 设计文档只保留当前有效基线
* 已完成阶段的细节以 Git 历史为准
* 新阶段开始前，先把设计输入写清楚，再进入实现
