'use client';

import type { AppProps } from 'next/app';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useTheme } from '../lib/theme';

export function ThemedApp({ Component, pageProps }: AppProps): React.ReactElement {
  const { theme } = useTheme();

  // Dynamic theme configuration for Ant Design
  const customTheme = {
    algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#a855f7',
      colorBgBase: theme === 'dark' ? '#0a0a12' : '#f8f9fc',
      colorBgContainer: theme === 'dark' ? 'rgba(15, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      colorBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      colorBgElevated: theme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 1)',
      colorText: theme === 'dark' ? '#ffffff' : '#1a1a2e',
      colorTextSecondary: theme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(26, 26, 46, 0.7)',
      colorTextTertiary: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      colorBorderSecondary: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      borderRadius: 12,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
      Select: {
        colorBgElevated: theme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 1)',
        optionSelectedBg: 'rgba(168, 85, 247, 0.2)',
        colorBgSpotlight: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      },
      Modal: {
        contentBg: theme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        headerBg: theme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      },
      Input: {
        colorBgContainer: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        colorBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
        colorTextPlaceholder: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      },
      InputNumber: {
        colorBgContainer: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        colorBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
      },
      TextArea: {
        colorBgContainer: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        colorBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
        colorTextPlaceholder: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      },
      Card: {
        colorBgContainer: theme === 'dark' ? 'rgba(15, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        colorBorderSecondary: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      },
      Image: {
        colorBgElevated: theme === 'dark' ? 'rgba(10, 10, 18, 0.95)' : 'rgba(0, 0, 0, 0.85)',
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
