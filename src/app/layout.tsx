import type { Metadata } from 'next';
import './globals.css';
import '@arco-design/web-react/dist/css/arco.css';

export const metadata: Metadata = {
  title: '简历制作·源 — 在线免费制作专业简历',
  description: '零学习成本，3 分钟制作媲美企业级的专业简历并下载高质量 PDF。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
