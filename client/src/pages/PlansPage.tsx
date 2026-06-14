import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  List,
  Spin,
  message,
  Modal,
  Space,
  Divider,
  Statistic,
} from 'antd';
import {
  CheckCircleOutlined,
  CrownOutlined,
  RocketOutlined,
  GiftOutlined,
  WechatOutlined,
  AlibabaOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';
import type { Plan } from '@shared/types';

interface Props {
  userId: string;
  onPlanChange: (plan: string) => void;
}

export default function PlansPage({ userId, onPlanChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        api.getPlans(),
        api.getSubscriptionPlan(userId).catch(() => ({ data: null })),
      ]);
      setPlans(plansRes.data || []);
      setCurrentSubscription(subRes.data);
      if (subRes.data?.plan?.type) {
        setSelectedPlan(subRes.data.plan.type);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planType: string) => {
    if (planType === 'free') {
      message.info('免费套餐无需购买，新用户注册即享');
      return;
    }
    setSelectedPlan(planType);
    setPayModalOpen(true);
  };

  const handleMockPay = async () => {
    try {
      setPaying(true);
      await api.mockPay(userId, selectedPlan);
      message.success('支付成功！订阅已激活');
      setPayModalOpen(false);
      onPlanChange(selectedPlan);
      loadData();
    } catch (err: any) {
      message.error(err.message || '支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  const planIcons: Record<string, JSX.Element> = {
    free: <GiftOutlined style={{ fontSize: 36, color: '#52c41a' }} />,
    monthly: <CrownOutlined style={{ fontSize: 36, color: '#faad14' }} />,
    yearly: <RocketOutlined style={{ fontSize: 36, color: '#eb2f96' }} />,
  };

  const planBadgeColors: Record<string, string> = {
    free: 'green',
    monthly: 'gold',
    yearly: 'magenta',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentPlan = currentSubscription?.plan;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1
          className="gradient-text"
          style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}
        >
          选择适合您的套餐
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16 }}>
          解锁魅魔对话全部功能，享受更优质的交互体验
        </p>
      </div>

      {currentSubscription?.subscription?.status === 'active' && currentPlan && (
        <Card
          className="glass-card"
          style={{ marginBottom: 32, border: 'none' }}
        >
          <Space size="large" align="center" wrap>
            <div>
              <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                当前订阅
              </Tag>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginLeft: 12 }}>
                {currentPlan.name}
              </span>
            </div>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>每日上限</span>}
              value={currentPlan.dailyLimit}
              suffix="条"
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.45)' }}>每月上限</span>}
              value={currentPlan.monthlyLimit}
              suffix="条"
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
            {currentSubscription.subscription.endDate && (
              <Tag color="geekblue" style={{ fontSize: 14, padding: '4px 12px' }}>
                有效期至 {new Date(currentSubscription.subscription.endDate).toLocaleDateString('zh-CN')}
              </Tag>
            )}
          </Space>
        </Card>
      )}

      <Row gutter={[24, 24]}>
        {plans.map((plan) => {
          const isFeatured = plan.type === 'yearly';
          const isCurrent = currentPlan?.type === plan.type;

          return (
            <Col xs={24} md={8} key={plan.type}>
              <Card
                className={`glass-card plan-card ${isFeatured ? 'featured' : ''}`}
                style={{
                  border: isCurrent ? '2px solid #9254de' : 'none',
                  padding: isFeatured ? '4px' : 0,
                  position: 'relative',
                }}
                hoverable
              >
                {isFeatured && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      background: 'linear-gradient(135deg, #f5576c, #9254de)',
                      color: '#fff',
                      padding: '4px 16px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ⭐ 超值推荐
                  </div>
                )}

                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ marginBottom: 16 }}>{planIcons[plan.type]}</div>
                  <Tag
                    color={planBadgeColors[plan.type]}
                    style={{ fontSize: 14, padding: '4px 16px', marginBottom: 12 }}
                  >
                    {plan.name}
                  </Tag>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 800,
                      marginBottom: 4,
                      color: '#fff',
                    }}
                  >
                    {plan.price === 0 ? '免费' : (
                      <>
                        <span style={{ fontSize: 20 }}>¥</span>
                        {plan.price}
                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
                          {plan.priceUnit}
                        </span>
                      </>
                    )}
                  </div>

                  {plan.type === 'yearly' && (
                    <div style={{ marginBottom: 16 }}>
                      <Tag color="volcano" style={{ fontSize: 12 }}>
                        省 ¥{99 * 12 - 999}
                      </Tag>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 8, textDecoration: 'line-through' }}>
                        ¥1188/年
                      </span>
                    </div>
                  )}

                  <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                  <List
                    size="small"
                    dataSource={plan.description}
                    renderItem={(item: string) => (
                      <List.Item
                        style={{
                          border: 'none',
                          padding: '8px 0',
                          color: 'rgba(255,255,255,0.75)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                        }}
                      >
                        <CheckCircleOutlined
                          style={{ color: '#52c41a', marginTop: 2 }}
                        />
                        <span>{item}</span>
                      </List.Item>
                    )}
                  />

                  <div style={{ marginTop: 28 }}>
                    <Button
                      type={isFeatured ? 'primary' : 'default'}
                      size="large"
                      block
                      style={{
                        height: 48,
                        fontSize: 16,
                        fontWeight: 600,
                        background: isFeatured
                          ? 'linear-gradient(135deg, #9254de, #f093fb)'
                          : undefined,
                        border: isFeatured ? 'none' : '1px solid rgba(146,84,222,0.4)',
                      }}
                      onClick={() => handleSubscribe(plan.type)}
                    >
                      {isCurrent
                        ? '当前套餐'
                        : plan.price === 0
                        ? '立即注册'
                        : '立即购买'}
                    </Button>

                    {plan.type !== 'free' && (
                      <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                        <Space>
                          <SafetyCertificateOutlined /> 安全支付
                        </Space>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title="确认支付"
        open={payModalOpen}
        onCancel={() => !paying && setPayModalOpen(false)}
        footer={null}
        width={440}
      >
        {plans.find((p) => p.type === selectedPlan) && (
          <div>
            <Card
              style={{
                background: 'linear-gradient(135deg, rgba(146,84,222,0.12), rgba(240,147,251,0.1))',
                border: '1px solid rgba(146,84,222,0.3)',
                marginBottom: 24,
              }}
            >
              <Row justify="space-between" align="middle">
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#fff' }}>
                    {plans.find((p) => p.type === selectedPlan)!.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                    每日 {plans.find((p) => p.type === selectedPlan)!.dailyLimit} 条指令 / 每月{' '}
                    {plans.find((p) => p.type === selectedPlan)!.monthlyLimit} 条指令
                  </div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#d3adf7' }}>
                  ¥{plans.find((p) => p.type === selectedPlan)!.price}
                </div>
              </Row>
            </Card>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                选择支付方式
              </div>
              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Card
                    hoverable
                    style={{ cursor: 'pointer', border: '2px solid #07c160', background: 'rgba(7,193,96,0.08)' }}
                  >
                    <Space>
                      <WechatOutlined style={{ color: '#07c160', fontSize: 24 }} />
                      <span style={{ fontWeight: 600, color: '#fff' }}>微信支付</span>
                    </Space>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card hoverable style={{ cursor: 'pointer', background: 'rgba(22,119,255,0.08)', border: '1px solid rgba(22,119,255,0.3)' }}>
                    <Space>
                      <AlibabaOutlined style={{ color: '#1677ff', fontSize: 24 }} />
                      <span style={{ fontWeight: 600, color: '#fff' }}>支付宝</span>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={paying}
              onClick={handleMockPay}
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #9254de, #f093fb)',
                border: 'none',
              }}
            >
              立即支付 ¥{plans.find((p) => p.type === selectedPlan)!.price}
            </Button>

            <div
              style={{
                marginTop: 12,
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <SafetyCertificateOutlined /> 支付数据全程加密，Mock 环境仅供演示
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
