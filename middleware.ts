// @ts-nocheck
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Create a Supabase client configured for the middleware
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();

  // If there's no session and the user is trying to access protected dashboards, redirect them to sign-in
  if (!session && url.pathname === '/') {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If a session exists and they are trying to reach /auth/*, redirect them to home page
  if (session && url.pathname.startsWith('/auth')) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res;
}

// Specify matching paths for middleware protection
export const config = {
  matcher: ['/', '/auth/:path*'],
};
