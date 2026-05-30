import { createHash } from 'node:crypto';

export const ADMIN_COOKIE   = 'bg_admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export interface AdminUser {
  username: string;
  displayName: string;
  passwordHash: string;
}

/**
 * Parse ADMIN_USERS env var.
 * Format: "username:displayName:hashedPassword,username2:displayName2:hashedPassword2"
 */
export function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS ?? import.meta.env.ADMIN_USERS ?? '';
  if (!raw) return [];

  return raw.split(',').map(entry => {
    const [username, displayName, passwordHash] = entry.trim().split(':');
    return { username, displayName, passwordHash };
  }).filter(u => u.username && u.passwordHash);
}

export function validateLogin(username: string, password: string): AdminUser | null {
  const users = getAdminUsers();
  const hash  = hashPassword(password);
  return users.find(u => u.username === username && u.passwordHash === hash) ?? null;
}

/** Encode session as "username|displayName" in the cookie value */
export function encodeSession(user: AdminUser): string {
  return `${user.username}|${user.displayName}`;
}

export function decodeSession(value: string): { username: string; displayName: string } | null {
  const [username, displayName] = value.split('|');
  if (!username) return null;
  return { username, displayName: displayName ?? username };
}
