import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { isAdminRequest } from '@/lib/adminAuth';
import { isTeamRequest, setTeamSession } from '@/lib/teamAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pin = searchParams.get('pin');

  if (id) {
    if (!isAdminRequest(request) && !isTeamRequest(request, id)) {
      return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
    }
    const team = serverStore.getTeam(id);
    return NextResponse.json({ team });
  }

  if (pin) {
    const team = serverStore.getTeamByPin(pin);
    if (!team) return NextResponse.json({ team: null }, { status: 404 });
    const response = NextResponse.json({ team: { ...team, pin_code: '' } });
    setTeamSession(response, team.id);
    return response;
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  const teams = serverStore.getTeams();
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, name, pin_code, updates } = body;

    if (action === 'create' || (!id && name && pin_code)) {
      const newTeam = serverStore.createTeam(name, pin_code);
      const response = NextResponse.json({ team: { ...newTeam, pin_code: '' } });
      setTeamSession(response, newTeam.id);
      return response;
    }

    if (action === 'reset' && id) {
      if (!isAdminRequest(request)) {
        return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
      }
      const reset = serverStore.resetTeam(id);
      return NextResponse.json({ team: reset });
    }

    if (id && updates) {
      if (!isAdminRequest(request) && !isTeamRequest(request, id)) {
        return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
      }
      const updated = serverStore.updateTeam(id, updates);
      return NextResponse.json({ team: { ...updated, pin_code: '' } });
    }

    if (id && (name || pin_code || body.status || body.current_step !== undefined)) {
      if (!isAdminRequest(request) && !isTeamRequest(request, id)) {
        return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
      }
      const { id: teamId, ...rest } = body;
      const updated = serverStore.updateTeam(teamId, rest);
      return NextResponse.json({ team: { ...updated, pin_code: '' } });
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
  }
  serverStore.deleteTeam(id);
  return NextResponse.json({ success: true, id });
}
