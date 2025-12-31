import type { AppProps } from 'next/app';
import { ConfigProvider, theme as antTheme } from 'antd';
import Head from 'next/head';
import '../styles/globals.css';
import { ThemeProvider } from '../lib/theme';
import { ThemedApp } from '../components/ThemedApp';

export default function MyApp({ Component, pageProps }: AppProps): React.ReactElement {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <ThemeProvider>
        <ThemedApp Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </>
  );
}
