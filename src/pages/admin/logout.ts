import type { APIRoute } from 'astro';
import { ADMIN_COOKIE } from '../../lib/admin-auth';

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(ADMIN_COOKIE, { path: '/' });
  return redirect('/admin/login');
};
