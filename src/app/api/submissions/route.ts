import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { isTeamRequest } from '@/lib/teamAuth';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function db() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Supabase server client is not configured');
  return supabase;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }
  const { data: submissions, error } = await db()
    .from('submissions')
    .select('*')
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return NextResponse.json({ submissions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team_id, checkpoint_id } = body;

    if (!team_id || checkpoint_id === undefined) {
      return NextResponse.json(
        { error: 'team_id and checkpoint_id are required' },
        { status: 400 }
      );
    }

    if (!isAdminRequest(request) && !isTeamRequest(request, String(team_id))) {
      return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
    }

    const { data: sub, error } = await db()
      .from('submissions')
      .upsert(
        { team_id: String(team_id), checkpoint_id: Number(checkpoint_id) },
        { onConflict: 'team_id,checkpoint_id' }
      )
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ submission: sub });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
