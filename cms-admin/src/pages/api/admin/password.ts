import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/session';
import { changeAdminPassword } from '../../../lib/password';
import { GitHubApiError } from '../../../lib/github';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!requireAuth(request)) return json({ error: 'Unauthorized' }, 401);

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid payload' }, 400);
  }

  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return json({ error: 'Wypełnij wszystkie pola' }, 400);
  }
  if (newPassword.length < 8) {
    return json({ error: 'Nowe hasło musi mieć co najmniej 8 znaków' }, 400);
  }
  if (newPassword !== confirmPassword) {
    return json({ error: 'Nowe hasła nie są identyczne' }, 400);
  }

  try {
    await changeAdminPassword(currentPassword, newPassword);
    return json({ ok: true }, 200);
  } catch (err) {
    if (err instanceof Error && err.message === 'Incorrect current password') {
      return json({ error: 'Nieprawidłowe obecne hasło' }, 401);
    }
    if (err instanceof GitHubApiError) {
      return json({ error: 'Nie udało się zapisać nowego hasła w repozytorium' }, 502);
    }
    return json({ error: 'Nie udało się zmienić hasła' }, 500);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
