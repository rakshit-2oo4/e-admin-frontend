import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login', '/forgot-password', '/reset-password'];

export function proxy(req: NextRequest) {
    const loggedIn = req.cookies.get('ebc_psession')?.value === '1';
    const { pathname } = req.nextUrl;
    const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

    if (!loggedIn && !isPublic) return NextResponse.redirect(new URL('/login', req.url));
    if (loggedIn && (pathname === '/login' || pathname === '/')) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next|favicon.ico).*)'] };