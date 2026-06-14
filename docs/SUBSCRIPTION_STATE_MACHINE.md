# 订阅状态机 (Subscription State Machine)

## 1. 状态定义

| 状态 (Status) | 说明 | 进入条件 |
|:-------------|:-----|:---------|
| `trial` (试用) | 新用户默认状态，享受免费套餐 | 新用户注册时自动创建 |
| `active` (生效) | 订阅处于有效状态，可正常使用全部功能 | 支付成功 / 续费成功 / 过期后重新订阅 |
| `expired` (过期) | 订阅到期未续费，降级为免费体验 | 有效期结束且未自动续费 |
| `cancelled` (已取消) | 用户主动取消，在到期前仍可用，到期后不再续费 | 用户主动发起取消请求 |

## 2. 合法状态转移 (Transitions)

```
                        支付成功
                ┌──────────────────────┐
                │                      │
                ▼                      │
           ┌─────────┐           ┌─────────┐
  新用户   │         │  取消订阅  │         │
 ───────►  │  trial  │──────────►│cancelled│
           │         │           │         │
           └────┬────┘           └────┬────┘
                │                      │
                │ 支付成功             │ 重新订阅
                ▼                      ▼
           ┌─────────┐           ┌─────────┐
           │         │  到期     │         │
           │ active  │──────────►│ expired │
           │         │           │         │
           └────┬────┘           └────┬────┘
                │                      │
                │ 取消订阅             │ 重新订阅
                │                      │
                └──────────────────────┘
```

**转移矩阵**：

| 源状态 ↓ | trial | active | expired | cancelled |
|:---------|:-----:|:------:|:-------:|:---------:|
| **trial** | ✓ | ✓ | ✗ | ✗ |
| **active** | ✗ | ✓ | ✓ | ✓ |
| **expired** | ✗ | ✓ | ✓ | ✗ |
| **cancelled** | ✗ | ✓ | ✗ | ✓ |

代码实现参考：[subscription.service.ts](file:///Users/Mac/Desktop/06/0614-135/server/src/services/subscription.service.ts#L5-L14)

## 3. 套餐配额规则

### 3.1 套餐定义

| 套餐 | 类型 | 价格 | 每日上限 | 每月上限 | 说明 |
|:-----|:-----|:-----|:---------|:---------|:-----|
| 免费体验 | `free` | ¥0 | 5 条 | 50 条 | 新用户默认 |
| 月卡会员 | `monthly` | ¥99/月 | 100 条 | 2000 条 | 高级功能 |
| 年卡会员 | `yearly` | ¥999/年 | 200 条 | 5000 条 | 全部功能，省 ¥189 |

代码定义：[shared/types/index.ts](file:///Users/Mac/Desktop/06/0614-135/shared/types/index.ts#L86-L119)

### 3.2 配额计算规则

```
有效配额 = MIN(每日上限 - 今日已用, 每月上限 - 本月已用)
```

- **每日重置**：自然日 00:00:00 切换
- **每月重置**：自然月 1 日 00:00:00 切换
- **计数存储**：Redis 计数器，键格式：
  - 每日：`quota:daily:{userId}:{YYYYMMDD}`
  - 每月：`quota:monthly:{userId}:{YYYYMM}`

实现参考：[quota.service.ts](file:///Users/Mac/Desktop/06/0614-135/server/src/services/quota.service.ts#L9-L47)

## 4. 订阅生命周期

### 4.1 激活 (activate)
1. 检查当前状态是否可转移到 `active`
2. 计算有效期：月卡 +30 天，年卡 +365 天
3. 更新或创建订阅记录，设置 `autoRenew = true`

### 4.2 取消订阅 (cancel)
1. 检查当前状态是否可转移到 `cancelled`
2. 将 `endDate` 提前到当前时间
3. 设置 `autoRenew = false`
4. 已扣款项不退还，用户可用至原到期日

### 4.3 到期检查 (expire-check)
定时任务，每分钟扫描：
- 查找所有 `active` 状态且 `endDate < now` 的订阅
- 批量转移到 `expired` 状态，`autoRenew = false`

### 4.4 续费 (renew)
- `expired` / `cancelled` 状态的用户重新支付，激活新周期
- `active` 状态的月卡用户可购买年卡，立即升级并延长有效期

## 5. 数据库模型

| 表名 | 关键字段 | 说明 |
|:-----|:---------|:-----|
| `User` | id, email, nickname | 用户基础信息 |
| `Subscription` | userId, planType, status, startDate, endDate, autoRenew | 订阅记录 |
| `Plan` | type, name, price, dailyLimit, monthlyLimit | 套餐定义 |
| `PaymentOrder` | paymentId(唯一), userId, planType, amount, status | 支付订单 |

详细定义：[schema.prisma](file:///Users/Mac/Desktop/06/0614-135/server/prisma/schema.prisma#L10-L68)
