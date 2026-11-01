import {recordPath, decryptRecord} from './receipt-codec.mjs';

function response(value, status=200) {
  return Response.json(value, {status});
}

/** @type {typeof fetch} */
export async function staticRequest(input, init) {
  const path = typeof input === 'string' ? input : input instanceof URL ? input.pathname : new URL(input.url).pathname;
  try {
    if (path === '/api/status') {
      const result = await fetch('./status.json', {cache:'no-store'});
      return result.ok ? response(await result.json()) : response({error:'조회 정보를 불러오지 못했습니다.'},503);
    }
    if (path !== '/api/lookup' || init?.method !== 'POST') return response({error:'지원하지 않는 요청입니다.'},405);
    let studentId;
    try {studentId = JSON.parse(String(init.body)).studentId?.trim();} catch {return response({error:'학번 8자리를 입력해 주세요.'},400);}
    if (typeof studentId !== 'string' || !/^\d{8}$/.test(studentId)) return response({error:'학번 8자리를 입력해 주세요.'},400);
    const file = await recordPath(studentId);
    const result = await fetch('./records/' + file, {cache:'no-store'});
    if (result.status === 404) return response({error:'등록된 학번을 찾지 못했습니다.'},404);
    if (!result.ok) return response({error:'현재 제출 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.'},503);
    const decoded = await decryptRecord(studentId, await result.json());
    if (!Array.isArray(decoded?.courses) || typeof decoded?.asOf !== 'string') throw new Error('invalid_record');
    return response(decoded);
  } catch {
    return response({error:'현재 제출 내역을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.'},503);
  }
}
