import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { serverStore } from '@/lib/serverStore';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { Checkpoint } from '@/types/database';

export const dynamic = 'force-dynamic';

async function loadCheckpoints(): Promise<Checkpoint[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('checkpoints')
      .select('*')
      .order('step_number', { ascending: true });
    if (!error && data) return data as Checkpoint[];
  }
  return serverStore.getCheckpoints();
}

export async function GET(request: NextRequest) {
  const checkpoints = await loadCheckpoints();
  if (isAdminRequest(request)) return NextResponse.json({ checkpoints });
  return NextResponse.json({
    checkpoints: checkpoints.map((checkpoint) => ({ ...checkpoint, qr_token: '' })),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { stepNumber?: number; token?: string }
    | null;
  const stepNumber = Number(body?.stepNumber);
  const token = body?.token?.trim() || '';
  if (!Number.isInteger(stepNumber) || !token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const checkpoints = await loadCheckpoints();
  const checkpoint = checkpoints.find((item) => item.step_number === stepNumber);
  return NextResponse.json({ valid: Boolean(checkpoint?.qr_token && checkpoint.qr_token === token) });
}
