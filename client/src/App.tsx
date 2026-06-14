import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Tag } from 'antd';
import {
  ShoppingOutlined,
  FileTextOutlined,
  UserOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import PlansPage from './pages/PlansPage';
import UserCenterPage from './pages/UserCenterPage';
import ReconciliationPage from './pages/ReconciliationPage';
import DashboardPage from './pages/DashboardPage';
import RiskControlPage from './pages/RiskControlPage';

const { Header, Sider, Content } = Layout;

const MOCK_USER = {
  id: 'user_demo_001',
  email: 'demo@succubus.chat',
  nickname: '魅魔体验用户',
};

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('monthly');

  useEffect(() => {
    localStorage.setItem('currentUserId', MOCK_USER.id);
  }, []);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: '/plans',
      icon: <ShoppingOutlined />,
      label: '套餐购买',
    },
    {
      key: '/center',
      icon: <UserOutlined />,
      label: '用户中心',
    },
    {
      key: '/reconciliation',
      icon: <FileTextOutlined />,
      label: '对账报表',
    },
    {
      key: '/risk',
      icon: <SafetyCertificateOutlined />,
      label: '风控管理',
    },
  ];

  const userDropdownItems = [
    {
      key: '1',
      label: (
        <Space>
          <Tag color="purple">
            {currentPlan === 'monthly'
              ? '月卡会员'
              : currentPlan === 'yearly'
              ? '年卡会员'
              : '免费用户'}
          </Tag>
        </Space>
      ),
    },
    { key: '2', label: 'ID: ' + MOCK_USER.id },
    { type: 'divider' as const },
    { key: '3', label: '退出登录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        style={{
          background: 'rgba(15, 5, 30, 0.95)',
          borderRight: '1px solid rgba(146, 84, 222, 0.2)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(146, 84, 222, 0.2)',
          }}
        >
          <span
            className="gradient-text"
            style={{
              fontSize: collapsed ? 18 : 22,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? '魅' : '魅魔对话'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[window.location.pathname]}
          style={{
            background: 'transparent',
            borderRight: 'none',
            marginTop: 16,
          }}
        >
          {menuItems.map((item) => (
            <Menu.Item key={item.key} icon={item.icon}>
              <NavLink to={item.key} style={{ color: 'inherit', textDecoration: 'none' }}>
                {item.label}
              </NavLink>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: 'rgba(15, 5, 30, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(146, 84, 222, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            欢迎回来，<span className="gradient-text">{MOCK_USER.nickname}</span> 👋
          </div>
          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', color: '#fff' }}>
              <Avatar
                size={36}
                style={{
                  background: 'linear-gradient(135deg, #9254de, #f093fb)',
                  fontWeight: 700,
                }}
              >
                {MOCK_USER.nickname[0]}
              </Avatar>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{MOCK_USER.email}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage userId={MOCK_USER.id} />} />
            <Route
              path="/plans"
              element={<PlansPage userId={MOCK_USER.id} onPlanChange={setCurrentPlan} />}
            />
            <Route
              path="/center"
              element={<UserCenterPage userId={MOCK_USER.id} />}
            />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/risk" element={<RiskControlPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
