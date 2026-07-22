import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function isPrivateAddress(address: string) {
  if (address === '::1' || address === '0.0.0.0') return true;
  if (address.startsWith('10.') || address.startsWith('127.') || address.startsWith('169.254.') || address.startsWith('192.168.')) return true;
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true;
  const match = address.match(/^172\.(\d+)\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

async function assertPublicTarget(target: URL) {
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid protocol');
  const addresses = isIP(target.hostname)
    ? [{ address: target.hostname }]
    : await lookup(target.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Private address');
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let target: URL;
  try {
    const body = await request.json() as { url?: string };
    target = new URL(body.url ?? '');
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid protocol');
  } catch {
    return Response.json({ reachable: false, reason: '올바른 http(s) 주소가 아닙니다.' }, { status: 400 });
  }

  try {
    let currentTarget = target;
    let response: Response | undefined;
    for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
      await assertPublicTarget(currentTarget);
      response = await fetch(currentTarget, {
        method: 'GET',
        headers: { Range: 'bytes=0-0', 'User-Agent': 'AppSquare-Link-Checker/1.0' },
        redirect: 'manual',
        signal: AbortSignal.timeout(7000),
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirectCount === 5) throw new Error('Too many redirects');
      currentTarget = new URL(location, currentTarget);
    }
    if (!response) throw new Error('No response');

    return Response.json({
      reachable: response.status < 500,
      status: response.status,
      reason: response.status >= 500 ? `서버 오류 (${response.status})` : undefined,
    });
  } catch (error) {
    const reason = error instanceof Error && error.message === 'Private address'
      ? '내부 네트워크 주소는 확인할 수 없습니다.'
      : '사이트에 연결할 수 없습니다.';
    return Response.json({ reachable: false, reason });
  }
}
