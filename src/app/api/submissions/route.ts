import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { isAdminRequest } from '@/lib/adminAuth';
import { isTeamRequest } from '@/lib/teamAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }
  const submissions = serverStore.getSubmissions();
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

    const sub = serverStore.recordSubmission(team_id, Number(checkpoint_id));
    return NextResponse.json({ submission: sub });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
