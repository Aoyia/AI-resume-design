import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 将同步文件的读写移出 src 源码目录，改到项目根目录下，防止触发 Next.js 的 HMR 重新编译与 Fast Refresh 挂载闪退
const FILE_PATH = path.join(process.cwd(), 'defaultResume.json');
const BACKUP_PATH = path.join(process.cwd(), 'src/data/defaultResume.json');

function getResumeFilePath(): string {
  if (!fs.existsSync(FILE_PATH)) {
    if (fs.existsSync(BACKUP_PATH)) {
      console.log('[Sync API] Initializing root defaultResume.json from template in src/data/');
      fs.copyFileSync(BACKUP_PATH, FILE_PATH);
    } else {
      // 降级兜底创建空文件
      fs.writeFileSync(FILE_PATH, '{}', 'utf-8');
    }
  }
  return FILE_PATH;
}

// GET：获取完整数据或仅查询最后修改时间 mtime
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const targetPath = getResumeFilePath();

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'Resume file not found' }, { status: 404 });
    }

    const stats = fs.statSync(targetPath);
    const mtime = Math.floor(stats.mtimeMs);

    if (action === 'check') {
      return NextResponse.json({ mtime });
    }

    const fileContent = fs.readFileSync(targetPath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json({ data, mtime });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST：覆盖写入物理文件
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = JSON.stringify(body, null, 2);
    const targetPath = getResumeFilePath();

    fs.writeFileSync(targetPath, content, 'utf-8');

    const stats = fs.statSync(targetPath);
    const mtime = Math.floor(stats.mtimeMs);

    return NextResponse.json({ success: true, mtime });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
