import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const TEAM_SESSION_COOKIE = 'scavenger_team_session';

function secret(): string {
  return process.env.TEAM_SESSION_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim() || '';
}

function signature(teamId: string): string {
  const key = secret();
  return key ? createHmac('sha256', key).update(`team:${teamId}`).digest('hex') : '';
}

export function isTeamRequest(request: NextRequest, teamId: string): boolean {
  const value = request.cookies.get(TEAM_SESSION_COOKIE)?.value || '';
  const separator = value.indexOf('.');
  if (separator < 1) return false;
  const cookieTeamId = value.slice(0, separator);
  const actual = value.slice(separator + 1);
  const expected = signature(teamId);
  if (cookieTeamId !== teamId || !expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function setTeamSession(response: NextResponse, teamId: string): void {
  const signed = signature(teamId);
  if (!signed) throw new Error('TEAM_SESSION_SECRET is not configured');
  response.cookies.set(TEAM_SESSION_COOKIE, `${teamId}.${signed}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}
