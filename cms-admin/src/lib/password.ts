import { randomBytes, scryptSync } from 'node:crypto';
import { constantTimeStringEqual } from './session';
import { getFile, putFile } from './github';

// The initial password comes from Vercel's ADMIN_PASSWORD environment variable.
// Once changed in the panel, only this server-side hash is used for future logins.
const PASSWORD_PATH = 'content/.cms-admin-password';

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyHash(password: string, stored: string): boolean {
  const [algorithm, saltHex, hashHex] = stored.trim().split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex || !/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(hashHex)) {
    return false;
  }

  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return actual.length === expected.length && constantTimeStringEqual(actual.toString('hex'), expected.toString('hex'));
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = await getFile(PASSWORD_PATH);
  if (stored?.content) return verifyHash(password, stored.content);

  const configured = import.meta.env.ADMIN_PASSWORD;
  return Boolean(configured && constantTimeStringEqual(password, configured));
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  if (!(await verifyAdminPassword(currentPassword))) {
    throw new Error('Incorrect current password');
  }

  const existing = await getFile(PASSWORD_PATH);
  await putFile(
    PASSWORD_PATH,
    `${hashPassword(newPassword)}\n`,
    'CMS: change admin password',
    existing?.sha,
  );
}
