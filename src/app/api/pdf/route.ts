import { NextRequest, NextResponse } from 'next/server';
import { resumeTempStore } from '@/lib/tempStore';
import { uid } from '@/lib/utils';

export async function POST(req: NextRequest) {
  let browser;
  const id = uid();
  try {
    const body = await req.json();
    let resumeData;
    let format = 'pdf';

    // 兼具兼容性：解析传入的数据
    if (body && body.resume) {
      resumeData = body.resume;
      format = body.format || 'pdf';
    } else {
      resumeData = body;
    }

    resumeTempStore.set(id, resumeData);

    // 动态引入 puppeteer（避免在 Edge Runtime 报错）
    const puppeteer = await import('puppeteer');

    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // 构建打印路由 URL，将简历数据通过 ID 传入
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/print?id=${id}`;

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // 等待页面进行真实的 A4 DOM 分页测量就绪
    await page.waitForSelector('[data-ready="true"]', { timeout: 10000 });

    // 等待字体加载完毕
    await page.evaluateHandle('document.fonts.ready');

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


