import { defineMiddleware } from 'astro:middleware';

const PUBLIC_PATHS = ['/login'];
const COOKIE_NAME  = 'bg_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Always allow the login page and static assets
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/uploads/')
  ) {
    return next();
  }

  const session = context.cookies.get(COOKIE_NAME);
  if (session?.value === 'authenticated') {
    return next();
  }

  // Not authenticated — redirect to login, preserving destination
  const loginUrl = new URL('/login', context.url);
  loginUrl.searchParams.set('redirect', pathname);
  return context.redirect(loginUrl.toString());
});
