# AGENTS.md

本文件是 ATSFlare 的 AI 接手入口，不承载详细设计、规范和计划。接手项目时，先按顺序阅读以下文档：

1. [docs/design.md](/Users/ryan/DEV/Go/ATSFlare/docs/design.md)
   作用：理解当前 MVP 的产品范围、系统边界、核心对象和整体架构。

2. [docs/development-guidelines.md](/Users/ryan/DEV/Go/ATSFlare/docs/development-guidelines.md)
   作用：理解当前开发规范，包括技术基线、分层约束、数据模型边界、API 约定、Agent 约束、测试要求。

3. [docs/development-plan.md](/Users/ryan/DEV/Go/ATSFlare/docs/development-plan.md)
   作用：理解当前开发阶段、实施顺序、阶段目标和验收标准。

## 接手要求

AI 在开始实现前，应先确认以下事实：

* 项目当前只做 MVP：配置发布与同步、节点心跳检测、Nginx 反向代理配置下发
* Server 基于 `atsf_server` 的 `gin-template + SQLite`
* Agent 位于 `atsf_agent`，使用 Go 单体程序
* 第一版只管理独立生成的 Nginx 路由配置文件
* 当前不做多租户、WAF、限流、Redis、对象存储、复杂缓存策略

## 执行要求

* 如果实现内容超出 `docs/design.md` 的范围，先修改设计文档，再继续编码。
* 如果实现方式违反 `docs/development-guidelines.md`，应优先调整方案，而不是绕过规范。
* 如果需求与当前开发阶段冲突，优先遵守 `docs/development-plan.md` 的阶段顺序。

## 文档优先级

当多个文档内容冲突时，按以下顺序处理：

1. `AGENTS.md`
2. `docs/design.md`
3. `docs/development-guidelines.md`
4. `docs/development-plan.md`

## 文档维护要求

当以下内容发生变化时，应同步更新对应文档：

* 产品范围或系统边界变化：更新 `docs/design.md`
* 开发约束、代码规范、接口约定变化：更新 `docs/development-guidelines.md`
* 阶段目标、顺序、验收标准变化：更新 `docs/development-plan.md`
