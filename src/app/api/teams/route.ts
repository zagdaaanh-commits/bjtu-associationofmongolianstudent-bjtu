import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pin = searchParams.get('pin');

  if (id) {
    const team = serverStore.getTeam(id);
    return NextResponse.json({ team });
  }

  if (pin) {
    const team = serverStore.getTeamByPin(pin);
    return NextResponse.json({ team });
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
      return NextResponse.json({ team: newTeam });
    }

    if (action === 'reset' && id) {
      const reset = serverStore.resetTeam(id);
      return NextResponse.json({ team: reset });
    }

    if (id && updates) {
      const updated = serverStore.updateTeam(id, updates);
      return NextResponse.json({ team: updated });
    }

    if (id && (name || pin_code || body.status || body.current_step !== undefined)) {
      const { id: teamId, ...rest } = body;
      const updated = serverStore.updateTeam(teamId, rest);
      return NextResponse.json({ team: updated });
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
  }
  serverStore.deleteTeam(id);
  return NextResponse.json({ success: true, id });
}
