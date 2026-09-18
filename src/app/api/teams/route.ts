import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { isTeamRequest, setTeamSession } from '@/lib/teamAuth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function db() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase server client is not configured');
  return supabase;
}

function playerSafe<T extends { pin_code?: string }>(team: T) {
  return { ...team, pin_code: '' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pin = searchParams.get('pin');

  if (id) {
    if (!isAdminRequest(request) && !isTeamRequest(request, id)) {
      return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
    }
    const { data: team, error } = await db().from('teams').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ team: team ? playerSafe(team) : null });
  }

  if (pin) {
    const { data: team, error } = await db()
      .from('teams')
      .select('*')
      .eq('pin_code', pin.trim())
      .maybeSingle();
    if (error) throw error;
    if (!team) return NextResponse.json({ team: null }, { status: 404 });
    const response = NextResponse.json({ team: playerSafe(team) });
    setTeamSession(response, team.id);
    return response;
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  const { data: teams, error } = await db()
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, name, pin_code, updates } = body;

    if (action === 'create' || (!id && name && pin_code)) {
      const cleanName = String(name || '').trim();
      const cleanPin = String(pin_code || '').trim();
      if (!cleanName || !/^\d{4}$/.test(cleanPin)) {
        return NextResponse.json({ error: 'Team name and a 4-digit PIN are required' }, { status: 400 });
      }
      const { data: newTeam, error } = await db()
        .from('teams')
        .upsert({ name: cleanName, pin_code: cleanPin }, { onConflict: 'pin_code' })
        .select('*')
        .single();
      if (error) throw error;
      const response = NextResponse.json({ team: playerSafe(newTeam) });
      setTeamSession(response, newTeam.id);
      return response;
    }

    if (action === 'reset' && id) {
      if (!isAdminRequest(request)) {
        return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
      }
      const { data: reset, error } = await db()
        .from('teams')
        .update({
          current_step: 0,
          status: 'photo_pending',
          initial_photo_url: null,
          started_at: null,
          finished_at: null,
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ team: reset });
    }

    if (id && updates) {
      if (!isAdminRequest(request) && !isTeamRequest(request, id)) {
        return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
      }
      const { data: updated, error } = await db()
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return NextResponse.json({ team: isAdminRequest(request) ? updated : playerSafe(updated) });
    }

    if (id && (name || pin_code || body.status || body.current_step !== undefined)) {
      if (!isAdminRequest(request) && !isTeamRequest(request, id)) {
        return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
      }
      const { id: teamId, action: _action, ...rest } = body;
      const { data: updated, error } = await db()
        .from('teams')
        .update(rest)
        .eq('id', teamId)
        .select('*')
        .single();
      if (error) throw error;
      return NextResponse.json({ team: isAdminRequest(request) ? updated : playerSafe(updated) });
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
  const { error } = await db().from('teams').delete().eq('id', id);
  if (error) throw error;
  return NextResponse.json({ success: true, id });
}
