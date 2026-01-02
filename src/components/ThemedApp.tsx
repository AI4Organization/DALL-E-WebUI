import { ConfigProvider, theme as antTheme } from 'antd';
import { useTheme } from '../lib/theme';

interface ThemedAppProps {
  children: React.ReactNode;
}

export function ThemedApp({ children }: ThemedAppProps): React.ReactElement {
  const { theme, mounted } = useTheme();

  // Use light theme (server default) until mounted to prevent hydration mismatch
  const effectiveTheme = mounted ? theme : 'light';

  // Dynamic theme configuration for Ant Design
  const customTheme = {
    algorithm: effectiveTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#a855f7',
      colorBgBase: effectiveTheme === 'dark' ? '#0a0a12' : '#f8f9fc',
      colorBgContainer: effectiveTheme === 'dark' ? 'rgba(15, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      colorBorder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      colorBgElevated: effectiveTheme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 1)',
      colorText: effectiveTheme === 'dark' ? '#ffffff' : '#1a1a2e',
      colorTextSecondary: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(26, 26, 46, 0.7)',
      colorTextTertiary: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      colorBorderSecondary: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      borderRadius: 12,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
      Select: {
        colorBgElevated: effectiveTheme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        optionSelectedBg: 'rgba(168, 85, 247, 0.15)',
        optionActiveBg: 'rgba(168, 85, 247, 0.1)',
        colorBgSpotlight: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(168, 85, 247, 0.05)',
        colorText: effectiveTheme === 'dark' ? '#ffffff' : '#1a1a2e',
        colorTextDisabled: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
        colorTextPlaceholder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      },
      Modal: {
        contentBg: effectiveTheme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        headerBg: effectiveTheme === 'dark' ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      },
      Input: {
        colorBgContainer: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        colorBorder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
        colorTextPlaceholder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      },
      InputNumber: {
        colorBgContainer: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        colorBorder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
      },
      TextArea: {
        colorBgContainer: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
        colorBorder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
        colorTextPlaceholder: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(26, 26, 46, 0.5)',
      },
      Card: {
        colorBgContainer: effectiveTheme === 'dark' ? 'rgba(15, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        colorBorderSecondary: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      },
      Image: {
        colorBgElevated: effectiveTheme === 'dark' ? 'rgba(10, 10, 18, 0.95)' : 'rgba(0, 0, 0, 0.85)',
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      {children}
    </ConfigProvider>
  );
}
