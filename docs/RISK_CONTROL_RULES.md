# 风控规则表 (Risk Control Rules)

## 1. 风控等级体系

| 等级 (Level) | 严重度 | 行为 (Action) | 自动解除条件 | 说明 |
|:-------------|:-------|:--------------|:-------------|:-----|
| `normal` | 0 | `allow` (放行) | - | 账户正常，无限制 |
| `warning` | 1 | `warn` (警告) | 30 分钟无异常自动降级 | 触发轻度规则，响应头带警告信息 |
| `throttled` | 2 | `throttle` (限流) | 1 小时无异常自动降级 | 触发中度规则，延迟处理或拒绝部分请求 |
| `frozen` | 3 | `freeze` (冻结) | 24 小时后自动解冻，或管理员手动解冻 | 触发重度规则，禁止发送新指令（可读历史） |

代码定义：[risk-control.service.ts](file:///Users/Mac/Desktop/06/0614-135/server/src/services/risk-control.service.ts#L6-L28)

## 2. 阶梯执法机制 (Stepped Enforcement)

> **原则**：同一用户在短时间内多次违规，等级逐级 escalate，不会直接降级。

```
第1次违规 (warning)    -> warning
第2次违规 (任何等级)    -> throttled
第3次违规 (任何等级)    -> frozen 24h
```

**升级矩阵**：

| 当前等级 ↓ | 新检测到 warning | 新检测到 throttled | 新检测到 frozen |
|:-----------|:----------------|:-------------------|:----------------|
| `normal` | warning | throttled | frozen |
| `warning` | **throttled** | throttled | frozen |
| `throttled` | **frozen** | **frozen** | frozen |
| `frozen** | frozen | frozen | frozen |

实现参考：[applySteppedEnforcement](file:///Users/Mac/Desktop/06/0614-135/server/src/services/risk-control.service.ts#L158-L170)

## 3. 检测规则明细

### 3.1 规则一：IP 短时高频 (IP Frequency)

**Redis 键**：`risk:ip:{ip}:minute`，**窗口**：60 秒

| 阈值 (次/分钟) | 触发等级 | 提示信息 |
|:-------------|:---------|:---------|
| > 10 | `warning` | "请求频率超过10次/分钟，请降低请求频率" |
| > 20 | `throttled` | "请求频率超过20次/分钟，已限流" |
| > 30 | `frozen` | "请求频率超过30次/分钟，账户冻结24小时" |

### 3.2 规则二：重复内容发送 (Duplicate Content)

**Redis 键**：`risk:user:{userId}:duplicate:{sha256(content)}`，**窗口**：600 秒

使用 SHA-256 哈希内容去重。

| 阈值 (重复次数/10分钟) | 触发等级 | 提示信息 |
|:---------------------|:---------|:---------|
| > 5 | `warning` | "短时间内重复发送相同内容，请勿刷屏" |

### 3.3 规则三：异常长指令 (Content Length)

同步检查，无 Redis 依赖。

| 阈值 (字符数) | 触发等级 | 提示信息 |
|:------------|:---------|:---------|
| > 5,000 | `warning` | "指令内容较长，超过5000字符" |
| > 10,000 | `throttled` | "指令内容过长，超过10000字符，已限流" |

### 3.4 规则四：多规则叠加

当请求同时触发多条规则时，取**最高严重等级**的规则执行阶梯升级。

实现参考：[checkRisk](file:///Users/Mac/Desktop/06/0614-135/server/src/services/risk-control.service.ts#L75-L156)

## 4. 冻结用户行为约束

| 功能 | 是否可用 | 说明 |
|:-----|:--------:|:-----|
| 发送新指令 (POST /message/send) | ❌ | 返回 403，提示冻结剩余时间 |
| 查看历史消息 | ✅ | 可读不影响 |
| 套餐购买 / 续费 | ✅ | 可购买但仍需等冻结期结束 |
| 用户中心 / 查看配额 | ✅ | 数据浏览不受限 |
| 对账报表 (管理员) | ✅ | 管理功能不受限 |

实现参考：[quota.middleware.ts](file:///Users/Mac/Desktop/06/0614-135/server/src/middleware/quota.middleware.ts#L54-L74)

## 5. 风控状态存储

### 5.1 Redis 实时状态
- 当前等级：`risk:user:{userId}:status`
  - `warning` TTL=1800s (30min)
  - `throttled` TTL=3600s (1h)
  - `frozen` TTL=86400s (24h)
- 冻结到期时间戳：`risk:user:{userId}:frozen:until` TTL=86400s

### 5.2 数据库持久化日志 (RiskControlLog)

| 字段 | 说明 |
|:-----|:-----|
| userId | 用户ID |
| ip | 请求来源IP |
| action | 执行动作：allow/warn/throttle/freeze |
| level | 调整后的风控等级 |
| reason | 触发原因（人类可读） |
| metadata (JSON) | 上下文信息，如请求频率、内容长度等 |
| createdAt | 事件时间 |

数据库定义：[schema.prisma](file:///Users/Mac/Desktop/06/0614-135/server/prisma/schema.prisma#L107-L122)

## 6. 管理员手动操作

| 操作 | API | 效果 |
|:-----|:----|:-----|
| 手动冻结 | `POST /api/risk/:userId/freeze` body: { hours } | 自定义冻结小时数 |
| 手动解冻 | `POST /api/risk/:userId/unfreeze` | 立即恢复 normal |
| 查询状态 | `GET /api/risk/:userId/status` | 返回当前等级 |
| 查询日志 | `GET /api/risk/logs?userId=&limit=` | 查看风控事件 |

前端管理入口：[RiskControlPage.tsx](file:///Users/Mac/Desktop/06/0614/项目/byq-0614-135/client/src/pages/RiskControlPage.tsx)
