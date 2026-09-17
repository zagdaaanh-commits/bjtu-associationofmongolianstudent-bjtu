import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const sub = serverStore.recordSubmission(team_id, Number(checkpoint_id));
    return NextResponse.json({ submission: sub });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
