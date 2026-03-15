# OpenFlare 前端开发规范

本文档约束 `openflare_server/web` 的正式前端工程。它描述的是 `1.0.0` 之后仍然有效的结构、请求层、组件、样式、状态管理与测试基线。

## 1. 技术基线

默认技术栈：

* Next.js 15 App Router
* React 19
* TypeScript 5
* Tailwind CSS 4
* TanStack Query
* React Hook Form + Zod
* Zustand
* ESLint + Prettier
* Vitest + Testing Library + Playwright
* pnpm

要求：

* 默认使用 TypeScript
* 默认使用函数组件
* 默认使用 App Router
* 前端必须支持 `light`、`dark`、`system` 三种主题模式

禁止：

* 引入 Semantic UI
* 新增大型 UI 框架破坏现有组件基线
* 使用 jQuery 风格 DOM 操作

## 2. 目录与分层

推荐目录：

```text
app/
components/
features/
lib/
hooks/
store/
types/
styles/
tests/
```

职责约束：

* `app/`：路由、布局、页面组装
* `features/`：按业务域组织模块
* `components/`：跨 feature 复用组件
* `lib/`：请求客户端、环境变量、工具函数、常量
* `store/`：少量跨页面 UI 状态
* `types/`：共享类型定义

## 3. 路由与页面

页面文件只负责：

* 获取路由参数
* 组织页面结构
* 调用 feature 组件

页面不应负责：

* 手写复杂 API 细节
* 编写复杂表单校验逻辑
* 维护大量彼此耦合的局部状态

## 4. 数据请求与类型

### 4.1 请求层

所有 API 请求必须统一经过 `lib/api/`。

要求：

* 统一处理 `success/message/data` 响应结构
* 统一处理鉴权失效、网络异常和通用错误消息
* 统一维护资源接口与请求路径

禁止：

* 在页面组件中直接调用 `fetch('/api/...')`
* 在多个组件中重复拼接同一接口路径

### 4.2 状态分层

* 服务端状态：TanStack Query
* 页面临时状态：组件内部 `useState`
* 跨页面 UI 状态：Zustand

不推荐：

* 用 Zustand 保存服务端主数据
* 用 Context 代替完整数据层方案

### 4.3 类型

要求：

* 开启 TypeScript 严格模式
* 禁止滥用 `any`
* API 响应、表单输入、业务实体必须有明确类型

## 5. 表单与交互

统一使用：

* React Hook Form
* Zod

高风险操作必须：

* 二次确认
* 展示操作对象名称
* 明确成功与失败反馈

## 6. 样式与主题

样式原则：

* 统一使用 Tailwind CSS 与现有 token 体系
* 优先复用已有基础组件与布局组件
* 保持视觉层级、留白与语义颜色一致

主题要求：

* 同时支持 `light`、`dark`、`system`
* 用户选择必须持久化
* 首屏尽量避免主题闪烁

## 7. 测试与交付

每个页面至少具备：

* 加载态
* 空态
* 错误态
* 成功反馈

测试要求：

* 公共工具、类型转换、主题逻辑补单元测试
* 关键页面交互补组件测试
* 核心主链路补 Playwright 或等效联调验证

交付要求：

* 构建产物保持可静态导出
* 构建结果可被 Go Server 托管
* 新页面默认通过亮色与暗色模式验收
