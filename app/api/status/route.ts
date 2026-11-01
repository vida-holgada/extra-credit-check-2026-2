import { env } from 'cloudflare:workers';
import { loadData, PRIVATE_HEADERS } from '../../../lib/receipts.mjs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { data, demo } = loadData(env);
    return Response.json({ asOf: data.asOf, demo }, { headers: PRIVATE_HEADERS });
  } catch {
    return Response.json({ asOf: null, demo: false }, { headers: PRIVATE_HEADERS });
  }
}
