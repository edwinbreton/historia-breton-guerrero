import type { APIRoute } from 'astro';
import { ADMIN_COOKIE, decodeSession } from '../../lib/admin-auth';
import { publishDrafts } from '../../lib/content-writer';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const session = cookies.get(ADMIN_COOKIE);
  const user    = session ? decodeSession(session.value) : null;
  if (!user) return redirect('/admin/login');

  try {
    const count = await publishDrafts(user.username);
    return redirect(`/admin?published=${count}`);
  } catch (e: any) {
    return redirect(`/admin?publishError=${encodeURIComponent(e?.message ?? 'Error desconocido')}`);
  }
};
