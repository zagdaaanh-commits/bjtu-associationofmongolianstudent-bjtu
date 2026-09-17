import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'scavenger_admin_session';

function getPasscode(): string {
  return process.env.ADMIN_PASSCODE?.trim() || '';
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || '';
}

function sessionToken(): string | null {
  const passcode = getPasscode();
  const secret = getSessionSecret();
  if (!passcode || !secret) return null;
  return createHmac('sha256', secret).update(`admin:${passcode}`).digest('hex');
}

export function adminAuthConfigured(): boolean {
  return Boolean(getPasscode() && getSessionSecret());
}

export function verifyAdminPasscode(candidate: string): boolean {
  const expected = getPasscode();
  const actual = candidate.trim();
  if (!expected || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function isAdminRequest(request: NextRequest): boolean {
  const expected = sessionToken();
  const actual = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  if (!expected || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function setAdminSession(response: NextResponse): void {
  const token = sessionToken();
  if (!token) throw new Error('Admin authentication is not configured');
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminSession(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
