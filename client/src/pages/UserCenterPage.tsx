import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Spin,
  Button,
  Space,
  Progress,
  Statistic,
  Tabs,
  List,
  message,
  Tooltip,
} from 'antd';
import {
  SyncOutlined,
  RedoOutlined,
  HistoryOutlined,
  MessageOutlined,
  RollbackOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';
import dayjs from 'dayjs';

interface Props {
  userId: string;
}

export default function UserCenterPage({ userId }: Props) {
  const [loading, setLoading] = useState(true);
  const [quotaUsage, setQuotaUsage] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [rollbacks, setRollbacks] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [flowPagination, setFlowPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [syncLoading, setSyncLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [usageRes, subRes, flowsRes, rollbackRes, paymentRes] = await Promise.all([
        api.getQuotaUsage(userId).catch(() => ({ data: null })),
        api.getSubscriptionPlan(userId).catch(() => ({ data: null })),
        api.getQuotaFlows(userId, flowPagination.pageSize, 0).catch(() => ({ data: { flows: [], total: 0 } })),
        api.getRollbackRecords(userId, 20).catch(() => ({ data: [] })),
        api.getPaymentHistory(userId).catch(() => ({ data: [] })),
      ]);

      setQuotaUsage(usageRes.data);
      setSubscription(subRes.data);
      setFlows(flowsRes.data?.flows || []);
      setFlowPagination((p) => ({ ...p, total: flowsRes.data?.total || 0, current: 1 }));
      setRollbacks(rollbackRes.data || []);
      setPayments(paymentRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncQuota = async () => {
    try {
      setSyncLoading(true);
      await api.syncQuota(userId);
      message.success('配额同步成功');
      loadAllData();
    } catch (err: any) {
      message.error(err.message || '同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      await api.cancelSubscription(userId);
      message.success('订阅已取消');
      loadAllData();
    } catch (err: any) {
      message.error(err.message || '取消失败');
    } finally {
      setCancelLoading(false);
    }
  };

  const loadFlows = async (page: number, pageSize: number) => {
    try {
      const offset = (page - 1) * pageSize;
      const res: any = await api.getQuotaFlows(userId, pageSize, offset);
      setFlows(res.data?.flows || []);
      setFlowPagination({ current: page, pageSize, total: res.data?.total || 0 });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const usage = quotaUsage?.usage || {};
  const plan = quotaUsage?.plan || { name: '免费体验', dailyLimit: 5, monthlyLimit: 50 };
  const sub = subscription?.subscription;
  const userPlan = subscription?.plan;

  const flowColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'deduct' ? 'blue' : 'green'}>
          {type === 'deduct' ? '扣减' : '回滚'}
        </Tag>
      ),
    },
    {
      title: '条数',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (val: number, record: any) => (
        <span
          style={{
            color: record.type === 'deduct' ? '#ff7875' : '#52c41a',
            fontWeight: 600,
          }}
        >
          {record.type === 'deduct' ? '-' : '+'}
          {val}
        </span>
      ),
    },
    {
      title: '消息ID',
      dataIndex: 'messageId',
      key: 'messageId',
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <code style={{ color: '#d3adf7', fontSize: 12 }}>
            {id?.slice(0, 16)}...
          </code>
        </Tooltip>
      ),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '扣减后余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 120,
      render: (val: number) => <Tag color="purple">{val} 条</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: '#fff', fontSize: 24 }}>用户中心</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            className="glass-card"
            style={{ border: 'none' }}
            title={
              <Space>
                <MessageOutlined style={{ color: '#9254de' }} />
                <span style={{ color: '#fff' }}>配额使用情况</span>
                <Button
                  type="text"
                  icon={<SyncOutlined spin={syncLoading} />}
                  onClick={handleSyncQuota}
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  同步
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>今日已用</span>}
                  value={usage.dailyUsed || 0}
                  suffix={`/ ${plan.dailyLimit}`}
                  valueStyle={{ color: '#1890ff', fontSize: 24 }}
                />
                <Progress
                  percent={Math.round(((usage.dailyUsed || 0) / plan.dailyLimit) * 100)}
                  strokeColor="#1890ff"
                  trailColor="rgba(255,255,255,0.1)"
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>本月已用</span>}
                  value={usage.monthlyUsed || 0}
                  suffix={`/ ${plan.monthlyLimit}`}
                  valueStyle={{ color: '#722ed1', fontSize: 24 }}
                />
                <Progress
                  percent={Math.round(((usage.monthlyUsed || 0) / plan.monthlyLimit) * 100)}
                  strokeColor="#722ed1"
                  trailColor="rgba(255,255,255,0.1)"
                  style={{ marginTop: 8 }}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>今日剩余</span>}
                  value={usage.dailyRemaining ?? plan.dailyLimit}
                  valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>本月剩余</span>}
                  value={usage.monthlyRemaining ?? plan.monthlyLimit}
                  valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            className="glass-card"
            style={{ border: 'none' }}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#9254de' }} />
                <span style={{ color: '#fff' }}>订阅信息</span>
              </Space>
            }
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>套餐</div>
                  <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                    {userPlan?.name || '免费体验'}
                  </Tag>
                </Col>
                <Col span={12}>
                  <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>状态</div>
                  <Tag
                    color={
                      sub?.status === 'active'
                        ? 'green'
                        : sub?.status === 'expired'
                        ? 'red'
                        : sub?.status === 'cancelled'
                        ? 'orange'
                        : 'blue'
                    }
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {sub?.status === 'active'
                      ? '已生效'
                      : sub?.status === 'expired'
                      ? '已过期'
                      : sub?.status === 'cancelled'
                      ? '已取消'
                      : '试用中'}
                  </Tag>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>生效时间</div>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {sub?.startDate ? dayjs(sub.startDate).format('YYYY-MM-DD') : '-'}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>到期时间</div>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {sub?.endDate ? dayjs(sub.endDate).format('YYYY-MM-DD') : '永久免费'}
                  </div>
                </Col>
              </Row>

              {sub?.status === 'active' && (
                <Button
                  danger
                  icon={<RedoOutlined />}
                  loading={cancelLoading}
                  onClick={handleCancelSubscription}
                  block
                >
                  取消订阅
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card className="glass-card" style={{ border: 'none' }}>
        <Tabs
          defaultActiveKey="flows"
          items={[
            {
              key: 'flows',
              label: (
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <HistoryOutlined /> 扣减流水
                </span>
              ),
              children: (
                <Table
                  columns={flowColumns}
                  dataSource={flows}
                  rowKey="id"
                  pagination={{
                    ...flowPagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: loadFlows,
                  }}
                  style={{ background: 'transparent' }}
                />
              ),
            },
            {
              key: 'rollbacks',
              label: (
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <RollbackOutlined /> 回滚记录
                </span>
              ),
              children: rollbacks.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 0',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  暂无回滚记录，系统运行稳定 🎉
                </div>
              ) : (
                <List
                  dataSource={rollbacks}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{
                        padding: '16px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Tag
                            color="green"
                            style={{ fontSize: 18, padding: '8px 16px', borderRadius: 8 }}
                          >
                            +{item.quotaFlow?.amount || 1}
                          </Tag>
                        }
                        title={
                          <Space>
                            <Tag color={item.isProcessed ? 'green' : 'orange'}>
                              {item.isProcessed ? '已处理' : '处理中'}
                            </Tag>
                            <span style={{ color: '#fff' }}>
                              重试次数: {item.retryCount || 0}
                            </span>
                          </Space>
                        }
                        description={
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>
                              错误原因: {item.errorReason || '未知'}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                              消息ID: {item.messageId} ·{' '}
                              {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'payments',
              label: (
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <FileTextOutlined /> 支付记录
                </span>
              ),
              children: payments.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 0',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  暂无支付记录
                </div>
              ) : (
                <List
                  dataSource={payments}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{
                        padding: '16px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Tag
                            color="purple"
                            style={{ fontSize: 18, padding: '8px 16px', borderRadius: 8 }}
                          >
                            ¥{item.amount}
                          </Tag>
                        }
                        title={
                          <Space>
                            <Tag color="blue">{item.planType}</Tag>
                            <Tag
                              color={
                                item.status === 'completed'
                                  ? 'green'
                                  : item.status === 'refunded'
                                  ? 'orange'
                                  : 'default'
                              }
                            >
                              {item.status === 'completed'
                                ? '已完成'
                                : item.status === 'refunded'
                                ? '已退款'
                                : item.status}
                            </Tag>
                            <span style={{ color: '#fff' }}>
                              币种: {item.currency}
                            </span>
                          </Space>
                        }
                        description={
                          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                            订单号: {item.paymentId} ·{' '}
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
