import { NextRequest, NextResponse } from 'next/server';
import { resumeTempStore } from '@/lib/tempStore';
import { uid } from '@/lib/utils';

export async function POST(req: NextRequest) {
  let browser;
  const id = uid();
  try {
    const body = await req.json();
    let resumeData;
    let pagesData;
    let format = 'pdf';

    // 兼具兼容性：解析传入的数据
    if (body && body.resume) {
      resumeData = body.resume;
      pagesData = body.pages;
      format = body.format || 'pdf';
    } else {
      resumeData = body;
    }

    resumeTempStore.set(id, { resume: resumeData, pages: pagesData });

    // 动态引入 puppeteer（避免在 Edge Runtime 报错）
    const puppeteer = await import('puppeteer');

    browser = await puppeteer.default.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // 构建打印路由 URL，将简历数据通过 ID 传入
    // 动态获取当前请求 of origin，解决本地运行端口被占用（如 3001, 3002）导致 puppeteer 无法连接正确端口的问题
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    if (baseUrl.includes('localhost')) {
      baseUrl = baseUrl.replace('localhost', '127.0.0.1');
    }
    const url = `${baseUrl}/print?id=${id}`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 等待页面进行真实的 A4 DOM 分页测量就绪
    await page.waitForSelector('[data-ready="true"]', { timeout: 15000 });

    // 安全等待字体准备就绪，最长等待 1000ms，以防外部网络字体加载被卡死
    await page.evaluate(() => {
      return Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 1000))
      ]);
    });

    if (format === 'image') {
      // 4倍超清 Retina 级别物理分辨率，极致清晰
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 4,
      });

      const element = await page.$('.print-wrapper');
      if (!element) {
        throw new Error('未找到渲染节点 .print-wrapper');
      }

      const imageBuffer = await element.screenshot({
        type: 'png',
        omitBackground: false,
      });

      await browser.close();

      return new NextResponse(new Uint8Array(imageBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="resume.png"',
          'Content-Length': imageBuffer.byteLength.toString(),
        },
      });
    }

    // 生成 A4 PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    console.error('[PDF/Image API Error]', err);
    return NextResponse.json(
      { error: '导出失败', detail: String(err) },
      { status: 500 }
    );
  } finally {
    resumeTempStore.delete(id);
  }
}


