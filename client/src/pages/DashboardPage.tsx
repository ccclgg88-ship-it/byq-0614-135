import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
  Alert,
  Tag,
  Button,
  Space,
} from 'antd';
import {
  MessageOutlined,
  SafetyOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  userId: string;
}

export default function DashboardPage({ userId }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quotaData, setQuotaData] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [riskStatus, setRiskStatus] = useState<any>(null);
  const [recentFlows, setRecentFlows] = useState<any[]>([]);

  const mockChartData = Array.from({ length: 7 }, (_, i) => ({
    date: dayjs().subtract(6 - i, 'day').format('MM-DD'),
    messages: Math.floor(Math.random() * 80) + 20,
  }));

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quotaRes, subRes, riskRes, flowsRes] = await Promise.all([
        api.getQuotaUsage(userId).catch(() => ({ data: null })),
        api.getSubscriptionPlan(userId).catch(() => ({ data: null })),
        api.getRiskStatus(userId).catch(() => ({ data: null })),
        api.getQuotaFlows(userId, 10).catch(() => ({ data: { flows: [] } })),
      ]);

      setQuotaData(quotaRes.data);
      setSubscription(subRes.data);
      setRiskStatus(riskRes.data);
      setRecentFlows(flowsRes.data?.flows || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const usage = quotaData?.usage || {};
  const plan = quotaData?.plan || { name: '免费体验', dailyLimit: 5, monthlyLimit: 50, type: 'free' };
  const dailyPercent = plan.dailyLimit ? (usage.dailyUsed / plan.dailyLimit) * 100 : 0;
  const monthlyPercent = plan.monthlyLimit ? (usage.monthlyUsed / plan.monthlyLimit) * 100 : 0;

  const statusColors: Record<string, string> = {
    normal: 'green',
    warning: 'orange',
    throttled: 'gold',
    frozen: 'red',
  };

  const statusText: Record<string, string> = {
    normal: '正常',
    warning: '警告',
    throttled: '限流中',
    frozen: '已冻结',
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 24 }}>控制台</h2>
        <Button type="primary" size="large" onClick={() => navigate('/plans')}>
          升级套餐 <ArrowRightOutlined />
        </Button>
      </div>

      {riskStatus?.status === 'frozen' && (
        <Alert
          message="账户已被风控冻结"
          description="由于异常操作，账户暂时冻结24小时，期间可查看历史消息但无法发送新指令。如有疑问请联系客服。"
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {riskStatus?.status === 'warning' && (
        <Alert
          message="账户处于风险警告状态"
          description="系统检测到您的操作存在异常，请减少操作频率，否则可能会被限流。"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card stats-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>当前套餐</span>}
              value={plan.name}
              prefix={<CalendarOutlined style={{ color: '#9254de' }} />}
              valueStyle={{ color: '#fff', fontSize: 18, fontWeight: 600 }}
            />
            {subscription?.subscription?.endDate && (
              <Tag color="purple" style={{ marginTop: 8 }}>
                有效期至 {dayjs(subscription.subscription.endDate).format('YYYY-MM-DD')}
              </Tag>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card stats-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>今日剩余指令</span>}
              value={usage.dailyRemaining ?? plan.dailyLimit}
              prefix={<MessageOutlined style={{ color: '#52c41a' }} />}
              suffix={`/ ${plan.dailyLimit}`}
              valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
            />
            <Progress
              percent={Math.round(dailyPercent)}
              showInfo={false}
              strokeColor={{ from: '#52c41a', to: '#95de64' }}
              trailColor="rgba(255,255,255,0.1)"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card stats-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>本月剩余指令</span>}
              value={usage.monthlyRemaining ?? plan.monthlyLimit}
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
              suffix={`/ ${plan.monthlyLimit}`}
              valueStyle={{ color: '#fff', fontSize: 24, fontWeight: 700 }}
            />
            <Progress
              percent={Math.round(monthlyPercent)}
              showInfo={false}
              strokeColor={{ from: '#1890ff', to: '#69c0ff' }}
              trailColor="rgba(255,255,255,0.1)"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card stats-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>风控状态</span>}
              value={statusText[riskStatus?.status || 'normal']}
              prefix={<SafetyOutlined />}
              valueStyle={{
                color: statusColors[riskStatus?.status || 'normal'] === 'green'
                  ? '#52c41a'
                  : statusColors[riskStatus?.status || 'normal'] === 'red'
                  ? '#ff4d4f'
                  : '#faad14',
                fontSize: 20,
                fontWeight: 700,
              }}
            />
            <Tag color={statusColors[riskStatus?.status || 'normal']} style={{ marginTop: 8 }}>
              {riskStatus?.status === 'frozen'
                ? '已冻结，不可发送新消息'
                : riskStatus?.status === 'warning'
                ? '请注意操作频率'
                : '账户运行正常'}
            </Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            className="glass-card"
            style={{ border: 'none' }}
            title={<span style={{ color: '#fff' }}>近7天使用趋势</span>}
          >
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" />
                  <YAxis stroke="rgba(255,255,255,0.45)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,5,30,0.95)',
                      border: '1px solid rgba(146,84,222,0.3)',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#9254de"
                    strokeWidth={3}
                    dot={{ fill: '#f093fb', strokeWidth: 2 }}
                    name="指令条数"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            className="glass-card"
            style={{ border: 'none' }}
            title={
              <Space>
                <span style={{ color: '#fff' }}>最近扣减流水</span>
                <Button type="link" size="small" onClick={() => navigate('/center')}>
                  查看全部
                </Button>
              </Space>
            }
          >
            {recentFlows.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', padding: '40px 0' }}>
                暂无流水记录
              </div>
            ) : (
              recentFlows.map((flow: any) => (
                <div
                  key={flow.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div>
                    <Tag color={flow.type === 'deduct' ? 'blue' : 'green'}>
                      {flow.type === 'deduct' ? '扣减' : '回滚'}
                    </Tag>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginLeft: 8 }}>
                      {dayjs(flow.createdAt).format('MM-DD HH:mm')}
                    </span>
                  </div>
                  <span
                    style={{
                      color: flow.type === 'deduct' ? '#ff7875' : '#52c41a',
                      fontWeight: 600,
                    }}
                  >
                    {flow.type === 'deduct' ? '-' : '+'}
                    {flow.amount}
                  </span>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
