import { env } from 'cloudflare:workers';
import { loadData, lookup, PRIVATE_HEADERS } from '../../../lib/receipts.mjs';

export const dynamic = 'force-dynamic';

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: PRIVATE_HEADERS });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: '조회 페이지에서 다시 시도해 주세요.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: '올바른 조회 요청이 아닙니다.' }, 400);
  const text = await request.text();
  if (text.length > 256) return json({ error: '학번 8자리를 입력해 주세요.' }, 400);
  let studentId: string;
  try {
    const body = JSON.parse(text);
    studentId = typeof body?.studentId === 'string' ? body.studentId.trim() : '';
    if (!/^\d{8}$/.test(studentId)) return json({ error: '학번 8자리를 입력해 주세요.' }, 400);
  } catch {
    return json({ error: '학번 8자리를 입력해 주세요.' }, 400);
  }
  try {
    const { data, demo } = loadData(env);
    const courses = lookup(data, studentId);
    if (!courses) return json({ error: '등록된 학번을 찾지 못했습니다. 학번을 다시 확인해 주세요.' }, 404);
    return json({ asOf: data.asOf, demo, courses });
  } catch {
    return json({ error: '현재 제출 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.' }, 503);
  }
}

export async function GET() {
  return json({ error: '학번을 입력해 조회해 주세요.' }, 405);
}
