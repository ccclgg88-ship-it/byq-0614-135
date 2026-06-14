import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Button,
  Input,
  Space,
  Modal,
  message,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';
import dayjs from 'dayjs';

const MOCK_USER_ID = 'user_demo_001';

export default function RiskControlPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState<any>(null);
  const [searchUserId, setSearchUserId] = useState(MOCK_USER_ID);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedUserStatus, setSearchedUserStatus] = useState<any>(null);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeTarget, setFreezeTarget] = useState<string>('');
  const [freezeHours, setFreezeHours] = useState(24);
  const [actionLoading, setActionLoading] = useState(false);

  const mockStats = [
    { key: 'total', label: '总监控数', value: 12580, color: '#1890ff', icon: <SafetyCertificateOutlined /> },
    { key: 'warning', label: '警告次数', value: 326, color: '#faad14', icon: <WarningOutlined /> },
    { key: 'throttled', label: '限流次数', value: 89, color: '#eb2f96', icon: <ThunderboltOutlined /> },
    { key: 'frozen', label: '冻结用户', value: 12, color: '#ff4d4f', icon: <LockOutlined /> },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [logsRes, statusRes] = await Promise.all([
        api.getRiskLogs(undefined, 50).catch(() => ({ data: [] })),
        api.getRiskStatus(MOCK_USER_ID).catch(() => ({ data: { status: 'normal' } })),
      ]);
      setLogs(logsRes.data || []);
      setCurrentUserStatus(statusRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchUserId.trim()) {
      message.warning('请输入用户ID');
      return;
    }
    try {
      setSearchLoading(true);
      const res: any = await api.getRiskStatus(searchUserId.trim());
      setSearchedUserStatus({
        userId: searchUserId.trim(),
        ...res.data,
      });
    } catch (err: any) {
      message.error(err.message || '查询失败');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFreeze = (userId: string) => {
    setFreezeTarget(userId);
    setFreezeHours(24);
    setFreezeModalOpen(true);
  };

  const confirmFreeze = async () => {
    try {
      setActionLoading(true);
      await api.freezeUser(freezeTarget, freezeHours);
      message.success(`已冻结用户 ${freezeTarget} ${freezeHours} 小时`);
      setFreezeModalOpen(false);
      handleSearchUser();
      loadInitialData();
    } catch (err: any) {
      message.error(err.message || '冻结失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async (userId: string) => {
    try {
      setActionLoading(true);
      await api.unfreezeUser(userId);
      message.success(`已解冻用户 ${userId}`);
      handleSearchUser();
      loadInitialData();
    } catch (err: any) {
      message.error(err.message || '解冻失败');
    } finally {
      setActionLoading(false);
    }
  };

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 160,
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <code style={{ fontSize: 12 }}>{id?.slice(0, 12)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const colors: Record<string, string> = {
          normal: 'green',
          warning: 'orange',
          throttled: 'gold',
          frozen: 'red',
        };
        const text: Record<string, string> = {
          normal: '正常',
          warning: '警告',
          throttled: '限流',
          frozen: '冻结',
        };
        return <Tag color={colors[level] || 'default'}>{text[level] || level}</Tag>;
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const colors: Record<string, string> = {
          allow: 'green',
          warn: 'orange',
          throttle: 'gold',
          freeze: 'red',
        };
        const text: Record<string, string> = {
          allow: '放行',
          warn: '警告',
          throttle: '限流',
          freeze: '冻结',
        };
        return <Tag color={colors[action] || 'default'}>{text[action] || action}</Tag>;
      },
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
  ];

  const statusColors: Record<string, string> = {
    normal: '#52c41a',
    warning: '#faad14',
    throttled: '#eb2f96',
    frozen: '#ff4d4f',
  };

  const statusText: Record<string, string> = {
    normal: '正常',
    warning: '警告',
    throttled: '限流中',
    frozen: '已冻结',
  };

  const renderUserStatusCard = (title: string, status: any) => {
    if (!status) return null;
    const level = status.status || 'normal';
    return (
      <Card
        className="glass-card"
        style={{ border: 'none', marginBottom: 24 }}
        title={<span style={{ color: '#fff' }}>{title}</span>}
      >
        <Descriptions column={2} labelStyle={{ color: 'rgba(255,255,255,0.55)' }} contentStyle={{ color: '#fff' }}>
          <Descriptions.Item label="用户ID">{status.userId || MOCK_USER_ID}</Descriptions.Item>
          <Descriptions.Item label="风控等级">
            <Tag color={statusColors[level]} style={{ fontSize: 14, padding: '4px 12px' }}>
              {statusText[level]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态说明" span={2}>
            {level === 'frozen'
              ? '账户已被冻结，期间可查看历史消息，但无法发送新指令'
              : level === 'throttled'
              ? '账户处于限流状态，请降低请求频率'
              : level === 'warning'
              ? '账户被警告过一次，请注意操作规范'
              : '账户一切正常'}
          </Descriptions.Item>
          {level === 'frozen' && (
            <Descriptions.Item label="操作" span={2}>
              <Space>
                <Button
                  type="primary"
                  icon={<UnlockOutlined />}
                  onClick={() => handleUnfreeze(status.userId || MOCK_USER_ID)}
                  loading={actionLoading}
                >
                  立即解冻
                </Button>
              </Space>
            </Descriptions.Item>
          )}
          {level !== 'frozen' && (
            <Descriptions.Item label="操作" span={2}>
              <Button
                danger
                icon={<LockOutlined />}
                onClick={() => handleFreeze(status.userId || MOCK_USER_ID)}
                loading={actionLoading}
              >
                手动冻结
              </Button>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 24 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          风控管理
        </h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {mockStats.map((stat) => (
          <Col xs={12} lg={6} key={stat.key}>
            <Card className="glass-card stats-card" style={{ border: 'none' }}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.label}</span>}
                value={stat.value}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color, fontSize: 28, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {renderUserStatusCard('当前用户风控状态', {
        userId: MOCK_USER_ID,
        ...currentUserStatus,
      })}

      <Card
        className="glass-card"
        style={{ border: 'none', marginBottom: 24 }}
        title={<span style={{ color: '#fff' }}>用户风控查询</span>}
      >
        <Space.Compact style={{ width: '100%', marginBottom: 16 }} size="large">
          <Input
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            placeholder="输入用户ID查询风控状态"
            prefix={<SearchOutlined />}
            onPressEnter={handleSearchUser}
          />
          <Button type="primary" onClick={handleSearchUser} loading={searchLoading}>
            查询
          </Button>
        </Space.Compact>
        {searchedUserStatus && renderUserStatusCard('查询结果', searchedUserStatus)}
      </Card>

      <Card
        className="glass-card"
        style={{ border: 'none' }}
        title={
          <Space>
            <span style={{ color: '#fff' }}>风控日志</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              最近 {logs.length} 条
            </Tag>
          </Space>
        }
      >
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={<span style={{ color: '#000' }}>手动冻结用户</span>}
        open={freezeModalOpen}
        onCancel={() => !actionLoading && setFreezeModalOpen(false)}
        onOk={confirmFreeze}
        confirmLoading={actionLoading}
        okText="确认冻结"
        okButtonProps={{ danger: true }}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>用户ID</div>
            <code style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 4 }}>
              {freezeTarget}
            </code>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>冻结时长（小时）</div>
            <Input
              type="number"
              min={1}
              max={720}
              value={freezeHours}
              onChange={(e) => setFreezeHours(parseInt(e.target.value || '24'))}
              addonAfter="小时"
            />
          </div>
          <div style={{ color: '#ff4d4f', fontSize: 13 }}>
            ⚠️ 冻结期间用户只能查看历史消息，不能发送新指令
          </div>
        </div>
      </Modal>
    </div>
  );
}
