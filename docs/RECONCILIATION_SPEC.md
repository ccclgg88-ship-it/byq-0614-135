# 对账口径 (Reconciliation Specification)

## 1. 对账目标

**目的**：验证当月收入金额与指令实际消耗是否匹配，识别异常差异（如系统 bug、恶意套利、数据丢失等），输出差异报告供运营介入。

**执行频率**：每月 1 日凌晨 03:00 自动执行上月对账，支持手动随时触发。

## 2. 核心公式

### 2.1 单用户预期条数

```
预期可用条数 (Expected) = ROUND( 用户实际支付金额 ÷ 单条单价 )
```

| 套餐 | 单条单价 | 来源环境变量 |
|:-----|:---------|:-------------|
| 月卡 (monthly) | ¥0.05 / 条 | `MONTHLY_PRICE_PER_MESSAGE` |
| 年卡 (yearly) | ¥0.033 / 条 | `YEARLY_PRICE_PER_MESSAGE` |
| 免费 (free) | N/A | 不计入付费对账 |

> **例**：用户购买月卡支付 ¥99 → 预期可用 = 99 ÷ 0.05 = 1980 条

### 2.2 单用户差异

```
差异条数 = 预期条数 - 实际扣减成功条数

差异率 (%) = (差异条数 ÷ 预期条数) × 100%
```

| 差异率范围 | 标识颜色 | 处理建议 |
|:-----------|:---------|:---------|
| ≤ 0.1% | 🟢 绿色 | 正常波动，无需处理 |
| 0.1% ~ 0.5% | 🟡 黄色 | 关注，后续月份观察 |
| 0.5% ~ 5% | 🟠 橙色 | 运营介入核查 |
| > 5% | 🔴 红色 | 技术排查，可能是系统问题 |

### 2.3 全平台整体差异

```
整体差异率 = (Σ 所有用户差异条数 ÷ Σ 所有用户预期条数) × 100%
```

**告警阈值**：整体差异率 > **0.1%** 时，全平台报表标红告警。  
环境变量：`RECONCILIATION_ALERT_THRESHOLD=0.1`

实现参考：[reconciliation.service.ts](file:///Users/Mac/Desktop/06/0614-135/server/src/services/reconciliation.service.ts#L8-L104)

## 3. 数据来源

### 3.1 收入侧（分子）

| 数据项 | 来源表 | 过滤条件 |
|:-------|:-------|:---------|
| 支付金额 | `PaymentOrder` | `status = 'completed'`，时间在当月周期内 |
| 用户类型 | `PaymentOrder.planType` | 区分 free / monthly / yearly |

> 仅统计**实际完成**的订单。`pending` / `refunded` 不计入对账。
> 退款处理：当月退款订单（`status='refunded'`）从收入中扣除，对应用户预期条数按比例修正。

### 3.2 消耗侧（分母）

| 数据项 | 来源表 | 过滤条件 |
|:-------|:-------|:---------|
| 实际成功扣减条数 | `QuotaFlow` | `type = 'deduct'`，当月周期内 |
| 失败回滚补偿条数 | `QuotaFlow` | `type = 'rollback'`，当月周期内（仅统计，不计入实际消耗） |

> 实际消耗以 **QuotaFlow 流水**为准，Redis 计数仅为实时辅助，对账以 DB 为准（可重放）。

## 4. 对账流程

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 确定对账周期 (period: YYYY-MM)                      │
│  例：2024-01 表示 [2024-01-01 00:00:00, 2024-02-01 00:00:00) │
└───────────────────────────────────────┬─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 查询当月完成的支付订单 (PaymentOrder)               │
│          按用户聚合 paidAmount, planType                     │
└───────────────────────────────────────┬─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 查询当月扣减流水 (QuotaFlow type='deduct')          │
│          按用户聚合 messageCount = SUM(amount)               │
└───────────────────────────────────────┬─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 统计回滚条数 (QuotaFlow type='rollback')            │
└───────────────────────────────────────┬─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 逐用户计算 expectedCount、discrepancy、discrepancyRate│
└───────────────────────────────────────┬─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: 计算整体指标，判断 isAlert，写入 DB                 │
│          (ReconciliationReport + ReconciliationRecord)       │
└───────────────────────────────────────┬─────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: 导出 CSV + 判断 exitCode (告警=1，正常=0)           │
│          路径: server/reports/reconciliation-{period}.csv    │
└─────────────────────────────────────────────────────────────┘
```

脚本入口：[reconciliation.ts](file:///Users/Mac/Desktop/06/0614-135/server/scripts/reconciliation.ts)

## 5. 报表字段定义

### 5.1 总体指标 (ReconciliationReport)

| 字段 | 说明 | 示例值 |
|:-----|:-----|:-------|
| period | 对账月份 | `2024-01` |
| totalUsers | 当月有支付的用户总数 | `1520` |
| paidUsers | 付费用户数（排除 free） | `860` |
| totalRevenue | 总收入 (¥) | `85446.00` |
| totalMessages | 实际成功扣减总条数 | `1,620,340` |
| expectedMessages | 预期总条数 | `1,621,800` |
| rolledBackMessages | 回滚补偿总条数 | `216` |
| discrepancyRate | 整体差异率 (%) | `0.090` |
| isAlert | 是否触发告警 (diff>0.1%) | `false` |
| createdAt | 报表生成时间 | ISO 时间 |

### 5.2 用户明细 (ReconciliationRecord)

| 字段 | 说明 | 数据类型 |
|:-----|:-----|:---------|
| userId | 用户ID | CUID String |
| userEmail | 用户邮箱 | String |
| planType | 套餐类型 | `free`/`monthly`/`yearly` |
| paidAmount | 实际支付金额 | Decimal |
| messageCount | 实际成功使用条数 | Int |
| expectedCount | 预期可用条数 | Int |
| discrepancy | 差异条数 (expected - actual) | Int |
| discrepancyRate | 差异率 (%) | Float |
| isAlert | 单用户是否超阈值 (>0.1%) | Bool |

数据库定义：[schema.prisma](file:///Users/Mac/Desktop/06/0614-135/server/prisma/schema.prisma#L124-L162)

## 6. 差异原因分类与处理

| 差异类型 | 差异方向 | 常见原因 | 处理方式 |
|:---------|:---------|:---------|:---------|
| **预期 >> 实际** (正差异) | 用户没用完配额 | 正常现象，大量用户使用量不足 | 无需处理，属于收入 |
| **实际 ≈ 预期** | 正常使用 | 用户按量消费 | 差异率 ≤0.1% 忽略 |
| **实际 >> 预期** (负差异) | 用量超出 | ① 月初月末边界 Redis TTL 不准确 ② 并发竞态 ③ 回滚失败 ④ 攻击绕过 | ⚠️ 技术排查 |
| **个别用户差异极大** | 单用户偏离 | ① 支付异常重复入账 ② 非法绕过配额 ③ 测试数据 | 运营单查该用户流水 |

## 7. 典型场景演练

### 7.1 场景：用户月底跨天使用导致边界误差

**问题**：Redis 计数器基于客户端时间，可能跨天延迟导致计数归属偏差。  
**影响**：单用户差异 1~5 条，整体 <0.01%。  
**解决**：对账以 DB QuotaFlow 的 `createdAt` 时间为准，Redis 仅实时统计，差异最终在 0.1% 阈值内。

### 7.2 场景：服务崩溃导致 confirmDeduct 未执行

**问题**：预扣减成功但服务重启，未确认扣减也未回滚。  
**机制**：
1. Redis 预扣减 key `quota:pre:{messageId}` TTL=600s，到期自动失效
2. `processRollbackCompensations` 定时任务扫描 RollbackCompensation 表 `isProcessed=false` 的记录，重试回滚
3. 对账时若发现 Redis 计数 > DB 流水，可通过 `POST /api/quota/:userId/sync` 手动对齐

补偿机制参考：[processRollbackCompensations](file:///Users/Mac/Desktop/06/0614-135/server/src/services/quota.service.ts#L241-L290)

## 8. API 与脚本

| 功能 | 方式 | 命令 / Endpoint |
|:-----|:-----|:----------------|
| 手动对账 | CLI | `cd server && bun run reconcile [YYYY-MM]` |
| 生成报表 | HTTP | `POST /api/reconciliation/generate` body: { period? } |
| 查询报表 | HTTP | `GET /api/reconciliation/report/:period` |
| 下载 CSV | HTTP | `GET /api/reconciliation/report/:period/csv` |
| 查看历史 | HTTP | `GET /api/reconciliation/history` |
| 明细分页 | HTTP | `GET /api/reconciliation/report/:period/detail?alert=true&limit=50` |

前端管理入口：[ReconciliationPage.tsx](file:///Users/Mac/Desktop/06/0614/项目/byq-0614-135/client/src/pages/ReconciliationPage.tsx)
