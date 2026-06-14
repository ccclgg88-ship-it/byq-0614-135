import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#9254de',
          colorInfo: '#9254de',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          colorBgContainer: 'rgba(255, 255, 255, 0.05)',
          colorBgElevated: 'rgba(30, 15, 55, 0.95)',
          colorBgLayout: 'transparent',
          colorBgSpotlight: 'rgba(146, 84, 222, 0.15)',
          colorBorder: 'rgba(146, 84, 222, 0.2)',
          colorBorderSecondary: 'rgba(146, 84, 222, 0.12)',
          colorText: 'rgba(255, 255, 255, 0.92)',
          colorTextSecondary: 'rgba(255, 255, 255, 0.72)',
          colorTextTertiary: 'rgba(255, 255, 255, 0.55)',
          colorTextQuaternary: 'rgba(255, 255, 255, 0.35)',
          colorFill: 'rgba(255, 255, 255, 0.12)',
          colorFillSecondary: 'rgba(255, 255, 255, 0.08)',
          colorFillTertiary: 'rgba(255, 255, 255, 0.04)',
          colorFillQuaternary: 'rgba(255, 255, 255, 0.02)',
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(255, 255, 255, 0.05)',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.15)',
            headerBg: 'rgba(255, 255, 255, 0.03)',
          },
          Table: {
            colorBgContainer: 'transparent',
            colorBgElevated: 'rgba(30, 15, 55, 0.95)',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.12)',
            rowHoverBg: 'rgba(146, 84, 222, 0.08)',
            headerBg: 'rgba(146, 84, 222, 0.1)',
            headerColor: 'rgba(255, 255, 255, 0.85)',
            headerSortActiveBg: 'rgba(146, 84, 222, 0.15)',
            colorText: 'rgba(255, 255, 255, 0.88)',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(146, 84, 222, 0.25)',
            darkItemSelectedColor: '#fff',
            darkItemHoverBg: 'rgba(146, 84, 222, 0.15)',
            colorItemBg: 'transparent',
            colorItemBgHover: 'rgba(146, 84, 222, 0.1)',
            colorItemBgSelected: 'rgba(146, 84, 222, 0.2)',
            colorItemTextSelected: '#fff',
            colorItemText: 'rgba(255, 255, 255, 0.75)',
            colorItemTextHover: '#fff',
          },
          Tabs: {
            itemColor: 'rgba(255, 255, 255, 0.65)',
            itemSelectedColor: '#fff',
            itemHoverColor: '#d3adf7',
            itemActiveColor: '#fff',
            inkBarColor: '#9254de',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.2)',
            cardBg: 'rgba(255, 255, 255, 0.04)',
          },
          Button: {
            colorPrimary: '#9254de',
            colorPrimaryHover: '#b37feb',
            colorPrimaryActive: '#722ed1',
            colorPrimaryBg: 'rgba(146, 84, 222, 0.1)',
            colorPrimaryBgHover: 'rgba(146, 84, 222, 0.15)',
            defaultBg: 'rgba(255, 255, 255, 0.06)',
            defaultBorderColor: 'rgba(146, 84, 222, 0.3)',
            defaultColor: 'rgba(255, 255, 255, 0.85)',
            defaultHoverBg: 'rgba(146, 84, 222, 0.12)',
            defaultHoverColor: '#fff',
            defaultHoverBorderColor: 'rgba(146, 84, 222, 0.5)',
          },
          Input: {
            colorBgContainer: 'rgba(255, 255, 255, 0.06)',
            colorBorder: 'rgba(146, 84, 222, 0.3)',
            colorText: 'rgba(255, 255, 255, 0.88)',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.35)',
            hoverBorderColor: 'rgba(146, 84, 222, 0.6)',
            activeBorderColor: '#9254de',
          },
          Select: {
            colorBgContainer: 'rgba(255, 255, 255, 0.06)',
            colorBorder: 'rgba(146, 84, 222, 0.3)',
            colorText: 'rgba(255, 255, 255, 0.88)',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.35)',
            colorBgElevated: 'rgba(30, 15, 55, 0.98)',
            optionSelectedColor: '#fff',
            optionSelectedBg: 'rgba(146, 84, 222, 0.2)',
          },
          Pagination: {
            colorBgContainer: 'rgba(255, 255, 255, 0.06)',
            colorBorder: 'rgba(146, 84, 222, 0.2)',
            colorText: 'rgba(255, 255, 255, 0.75)',
            colorPrimary: '#9254de',
            colorTextDisabled: 'rgba(255, 255, 255, 0.25)',
          },
          Descriptions: {
            colorText: 'rgba(255, 255, 255, 0.88)',
            colorTextSecondary: 'rgba(255, 255, 255, 0.55)',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.15)',
            colorBgContainer: 'rgba(255, 255, 255, 0.02)',
            labelBg: 'rgba(255, 255, 255, 0.04)',
          },
          List: {
            colorText: 'rgba(255, 255, 255, 0.85)',
            colorTextDescription: 'rgba(255, 255, 255, 0.55)',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.12)',
            headerBg: 'rgba(255, 255, 255, 0.04)',
          },
          Statistic: {
            colorText: 'rgba(255, 255, 255, 0.88)',
          },
          Tag: {
            colorText: 'rgba(255, 255, 255, 0.88)',
            defaultBg: 'rgba(255, 255, 255, 0.08)',
            defaultColor: 'rgba(255, 255, 255, 0.8)',
          },
          Modal: {
            colorBgElevated: 'rgba(25, 12, 45, 0.98)',
            colorText: 'rgba(255, 255, 255, 0.88)',
            colorTextSecondary: 'rgba(255, 255, 255, 0.55)',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.2)',
            headerBg: 'rgba(255, 255, 255, 0.02)',
          },
          Empty: {
            colorText: 'rgba(255, 255, 255, 0.45)',
          },
          Tooltip: {
            colorBgDefault: 'rgba(15, 5, 30, 0.95)',
          },
          Dropdown: {
            colorBgElevated: 'rgba(25, 12, 45, 0.98)',
            colorText: 'rgba(255, 255, 255, 0.85)',
            colorBorderSecondary: 'rgba(146, 84, 222, 0.15)',
          },
          Switch: {
            colorPrimary: '#9254de',
          },
          Alert: {
            colorText: 'rgba(255, 255, 255, 0.88)',
          },
          Result: {
            titleColor: 'rgba(255, 255, 255, 0.88)',
            subtitleColor: 'rgba(255, 255, 255, 0.55)',
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
