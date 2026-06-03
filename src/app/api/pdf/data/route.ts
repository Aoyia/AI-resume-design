import { NextRequest, NextResponse } from 'next/server';
import { resumeTempStore } from '@/lib/tempStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '缺少 ID 参数' }, { status: 400 });
  }
  const data = resumeTempStore.get(id);
  if (!data) {
    return NextResponse.json({ error: '数据未找到或已过期' }, { status: 404 });
  }
  return NextResponse.json(data);
}
