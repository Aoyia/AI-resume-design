import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import './globals.css';
import '@arco-design/web-react/dist/css/arco.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoTabs = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '简历制作·源 — 在线免费制作专业简历',
  description: '零学习成本，3 分钟制作媲美企业级的专业简历并下载高质量 PDF。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoTabs.variable} ${notoSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}

