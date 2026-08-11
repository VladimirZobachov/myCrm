import { NextRequest, NextResponse } from 'next/server';
import { bffMe } from '@/lib/bff';

// GET /api/auth/me — прокси к Laravel с токеном из httpOnly cookie
export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const data = await bffMe(cookieHeader);
    return NextResponse.json({ user: data.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
