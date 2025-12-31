import type { AppProps } from 'next/app';
import { ConfigProvider, theme as antTheme } from 'antd';

// Custom theme configuration
const customTheme = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#5f9ea0', // cadetblue - matching original design
    borderRadius: 6,
  },
};

export default function MyApp({ Component, pageProps }: AppProps): React.ReactElement {
  return (
    <ConfigProvider theme={customTheme}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
