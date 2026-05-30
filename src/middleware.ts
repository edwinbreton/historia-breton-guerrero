import { defineMiddleware } from 'astro:middleware';

const PUBLIC_COOKIE  = 'bg_session';
const ADMIN_COOKIE   = 'bg_admin_session';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Always allow static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/uploads/')) {
    return next();
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Login page is always accessible
    if (pathname === '/admin/login') return next();

    const adminSession = context.cookies.get(ADMIN_COOKIE);
    if (adminSession?.value) {
      return next();
    }

    const loginUrl = new URL('/admin/login', context.url);
    loginUrl.searchParams.set('redirect', pathname);
    return context.redirect(loginUrl.toString());
  }

  // ── Public routes ─────────────────────────────────────────────────────────
  if (pathname === '/login') return next();

  const publicSession = context.cookies.get(PUBLIC_COOKIE);
  if (publicSession?.value === 'authenticated') {
    return next();
  }

  const loginUrl = new URL('/login', context.url);
  loginUrl.searchParams.set('redirect', pathname);
  return context.redirect(loginUrl.toString());
});
