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
  Select,
  Space,
  Alert,
  Switch,
  message,
  Empty,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  AlertOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  MessageOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { api } from '../api/client';
import dayjs from 'dayjs';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
} from 'recharts';

const { Option } = Select;

export default function ReconciliationPage() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'));
  const [report, setReport] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [alertOnly, setAlertOnly] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const periodOptions = Array.from({ length: 12 }, (_, i) =>
    dayjs().subtract(i, 'month').format('YYYY-MM')
  );

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (period) {
      loadReport();
    }
  }, [period]);

  useEffect(() => {
    if (report?.reportId) {
      loadDetail();
    }
  }, [period, alertOnly]);

  const loadHistory = async () => {
    try {
      const res: any = await api.getReconciliationHistory(12);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const res: any = await api.getReconciliationReport(period);
      if (res.code === 200) {
        setReport(res.data);
      } else {
        setReport(null);
      }
    } catch (err: any) {
      if (err.code === 404) {
        setReport(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async () => {
    try {
      setDetailLoading(true);
      const res: any = await api.getReconciliationDetail(period, alertOnly, 100);
      if (res.code === 200) {
        setDetailData(res.data?.details || []);
        setDetailTotal(res.data?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res: any = await api.generateReconciliation(period);
      if (res.code === 200) {
        message.success(res.message);
        setReport(res.data);
        loadDetail();
        loadHistory();
      } else {
        message.error(res.message);
      }
    } catch (err: any) {
      message.error(err.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob: any = await api.downloadReconciliationCSV(period);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reconciliation-${period}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('CSV 下载成功');
    } catch (err: any) {
      message.error(err.message || '下载失败');
    }
  };

  const detailColumns = [
    {
      title: '用户',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 220,
      render: (email: string, record: any) => (
        <Space>
          <Tag color={record.isAlert ? 'red' : 'default'} style={{ fontSize: 12 }}>
            {record.planType}
          </Tag>
          <span style={{ color: record.isAlert ? '#ff7875' : 'rgba(255,255,255,0.85)' }}>
            {email}
          </span>
        </Space>
      ),
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 140,
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <code style={{ fontSize: 12 }}>{id?.slice(0, 12)}...</code>
        </Tooltip>
      ),
    },
    {
      title: '支付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 110,
      render: (v: number) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{v.toFixed(2)}</span>
      ),
    },
    {
      title: '实际使用',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 110,
      sorter: (a: any, b: any) => a.messageCount - b.messageCount,
    },
    {
      title: '预期条数',
      dataIndex: 'expectedCount',
      key: 'expectedCount',
      width: 110,
    },
    {
      title: '差异',
      dataIndex: 'discrepancy',
      key: 'discrepancy',
      width: 110,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#fa8c16' : '#52c41a', fontWeight: 600 }}>
          {v > 0 ? '+' : ''}
          {v}
        </span>
      ),
    },
    {
      title: '差异率',
      dataIndex: 'discrepancyRate',
      key: 'discrepancyRate',
      width: 120,
      sorter: (a: any, b: any) => a.discrepancyRate - b.discrepancyRate,
      render: (v: number, record: any) => (
        <Tag
          color={v > 0.1 ? 'red' : v > 0.05 ? 'orange' : 'green'}
          style={{ fontSize: 12 }}
        >
          {record.isAlert ? '⚠️ ' : ''}
          {v.toFixed(4)}%
        </Tag>
      ),
    },
  ];

  const pieData = [
    { name: '免费用户', value: (report?.totalUsers || 0) - (report?.paidUsers || 0), color: '#52c41a' },
    { name: '付费用户', value: report?.paidUsers || 0, color: '#722ed1' },
  ];

  const chartData = report?.details?.slice(0, 10).map((d: any) => ({
    name: d.userEmail?.split('@')[0] || d.userId?.slice(-8),
    预期: d.expectedCount,
    实际: d.messageCount,
  })) || [];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0, color: '#fff', fontSize: 24 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          对账报表
        </h2>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 160 }}
            size="large"
          >
            {periodOptions.map((p) => (
              <Option key={p} value={p}>
                {p}
                {history.find((h) => h.period === p)?.isAlert && (
                  <Tag color="red" style={{ marginLeft: 8 }}>
                    告警
                  </Tag>
                )}
              </Option>
            ))}
          </Select>
          <Button
            type="default"
            size="large"
            icon={<ReloadOutlined spin={loading} />}
            onClick={loadReport}
          >
            刷新
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<FileTextOutlined />}
            loading={generating}
            onClick={handleGenerate}
          >
            生成报表
          </Button>
          {report && (
            <Button
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载CSV
            </Button>
          )}
        </Space>
      </div>

      {report?.isAlert && (
        <Alert
          message={
            <Space>
              <AlertOutlined />
              对账告警
            </Space>
          }
          description={`整体差异率 ${report.discrepancyRate.toFixed(4)}% 超过阈值 0.1%，共 ${report.alertCount || 0} 个用户存在异常差异，请及时核查处理。`}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : !report ? (
        <Card
          className="glass-card"
          style={{ border: 'none', textAlign: 'center', padding: '80px 0' }}
        >
          <Empty
            description={
              <div style={{ color: 'rgba(255,255,255,0.65)' }}>
                <div style={{ marginBottom: 16 }}>
                  {period} 期间的对账报表尚未生成
                </div>
                <Button type="primary" size="large" onClick={handleGenerate} loading={generating}>
                  立即生成对账报表
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="glass-card stats-card" style={{ border: 'none' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>总用户数</span>}
                  value={report.totalUsers}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
                  suffix={
                    report.paidUsers > 0 && (
                      <span style={{ fontSize: 13, color: '#52c41a' }}>
                        付费 {report.paidUsers}
                      </span>
                    )
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="glass-card stats-card" style={{ border: 'none' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>总收入</span>}
                  value={report.totalRevenue}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="glass-card stats-card" style={{ border: 'none' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.55)' }}>消息条数</span>}
                  value={report.totalMessages}
                  prefix={<MessageOutlined style={{ color: '#13c2c2' }} />}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
                  suffix={
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                      / 预期 {report.expectedMessages}
                    </span>
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="glass-card stats-card" style={{ border: 'none' }}>
                <Statistic
                  title={
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                      整体差异率
                    </span>
                  }
                  value={report.discrepancyRate}
                  precision={4}
                  prefix={<SafetyOutlined />}
                  suffix="%"
                  valueStyle={{
                    color: report.isAlert ? '#ff4d4f' : '#52c41a',
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color="red">回滚 {report.rolledBackMessages} 条</Tag>
                  {report.isAlert && (
                    <Tag color="volcano">
                      <AlertOutlined /> 超过阈值
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card
                className="glass-card"
                style={{ border: 'none' }}
                title={<span style={{ color: '#fff' }}>用户结构</span>}
              >
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartTooltip
                        contentStyle={{
                          background: 'rgba(15,5,30,0.95)',
                          border: '1px solid rgba(146,84,222,0.3)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                className="glass-card"
                style={{ border: 'none' }}
                title={<span style={{ color: '#fff' }}>Top10 用户预期 vs 实际使用</span>}
              >
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.45)"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis stroke="rgba(255,255,255,0.45)" />
                      <RechartTooltip
                        contentStyle={{
                          background: 'rgba(15,5,30,0.95)',
                          border: '1px solid rgba(146,84,222,0.3)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ color: 'rgba(255,255,255,0.65)' }}
                      />
                      <Bar
                        dataKey="预期"
                        fill="#9254de"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="实际"
                        fill="#52c41a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Card
            className="glass-card"
            style={{ border: 'none' }}
            title={
              <Space>
                <span style={{ color: '#fff' }}>对账明细</span>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  共 {detailTotal} 条
                </Tag>
                <Switch
                  checkedChildren="仅告警"
                  unCheckedChildren="全部"
                  checked={alertOnly}
                  onChange={setAlertOnly}
                  size="small"
                />
              </Space>
            }
          >
            <Table
              columns={detailColumns}
              dataSource={detailData}
              rowKey="id"
              loading={detailLoading}
              rowClassName={(record) => (record.isAlert ? 'alert-row' : '')}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条差异记录`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
