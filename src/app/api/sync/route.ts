import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'src/data/defaultResume.json');

// GET：获取完整数据或仅查询最后修改时间 mtime
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!fs.existsSync(FILE_PATH)) {
      return NextResponse.json({ error: 'Resume file not found' }, { status: 404 });
    }

    const stats = fs.statSync(FILE_PATH);
    const mtime = Math.floor(stats.mtimeMs);

    if (action === 'check') {
      return NextResponse.json({ mtime });
    }

    const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
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

    fs.writeFileSync(FILE_PATH, content, 'utf-8');

    const stats = fs.statSync(FILE_PATH);
    const mtime = Math.floor(stats.mtimeMs);

    return NextResponse.json({ success: true, mtime });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
