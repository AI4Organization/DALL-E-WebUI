import type { AppProps } from 'next/app';
import { ConfigProvider, theme as antTheme } from 'antd';
import Head from 'next/head';
import '../styles/globals.css';
import { ThemeProvider } from '../lib/theme';
import { ThemedApp } from '../components/ThemedApp';

export default function MyApp(appProps: AppProps): React.ReactElement {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ThemeProvider>
        <ThemedApp {...appProps} />
      </ThemeProvider>
    </>
  );
}
