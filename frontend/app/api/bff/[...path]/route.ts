import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API, parseCookies } from '@/lib/bff';

// Универсальный BFF-прокси: /api/bff/{...path}
// Берёт токен из httpOnly cookie → Authorization: Bearer → проксирует в Laravel API.
// JS-клиент обращается к /api/bff/orders, /api/bff/users и т.д.

async function proxy(req: NextRequest, params: { path: string[] }) {
  const pathStr = params.path.join('/');
  const token = parseCookies(req.headers.get('cookie'));

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await req.text() : undefined;

  const target = `${BACKEND_API}/${pathStr}${req.nextUrl.search}`;
  const res = await fetch(target, { method: req.method, headers, body });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
