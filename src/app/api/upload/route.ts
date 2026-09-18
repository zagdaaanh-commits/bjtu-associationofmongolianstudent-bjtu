import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { isAdminRequest } from '@/lib/adminAuth';
import { isTeamRequest } from '@/lib/teamAuth';

export const dynamic = 'force-dynamic';

const BUCKET = 'TEAM-PHOTO';
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function safePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const isJson = request.headers.get('content-type')?.includes('application/json');

    if (isJson) {
      const body = await request.json();
      const raw = body.dataUrl || body.image || body.base64;
      if (typeof raw !== 'string' || !raw.trim()) {
        return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
      }
      const comma = raw.indexOf(',');
      const base64 = comma >= 0 ? raw.slice(comma + 1) : raw;
      const ext = raw.startsWith('data:image/png') ? 'png' : 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const teamId = safePart(String(body.teamId || 'unknown'));
      if (!isAdminRequest(request) && !isTeamRequest(request, teamId)) {
        return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
      }
      const bytes = Buffer.from(base64, 'base64');
      if (bytes.length === 0 || bytes.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Image must be between 1 byte and 2MB' }, { status: 400 });
      }
      const fileName = `team_${teamId}_${Date.now()}.${ext}`;

      // Local tests can use the filesystem; production must use durable storage.
      if (!process.env.VERCEL) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.join(uploadsDir, fileName), bytes);
        return NextResponse.json({ url: `/uploads/${fileName}` });
      }

      const filePath = `teams/${fileName}`;
      const supabase = getStorageClient();
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, bytes, {
        cacheControl: '3600',
        contentType,
        upsert: false,
      });
      if (error) {
        console.error('Supabase base64 upload failed:', { message: error.message, teamId });
        return NextResponse.json({ error: error.message }, { status: 502 });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return NextResponse.json({ url: data.publicUrl });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const teamId = safePart(String(formData.get('teamId') || 'unknown'));
    if (!isAdminRequest(request) && !isTeamRequest(request, teamId)) {
      return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
    }
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Image must be between 1 byte and 2MB' }, { status: 400 });

    const rawExt = file.name.includes('.') ? file.name.split('.').pop() : '';
    const ext = (rawExt || file.type.split('/')[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filePath = `teams/team_${teamId}_${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const supabase = getStorageClient();
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, bytes, {
      cacheControl: '3600',
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
    if (error) {
      console.error('Supabase multipart upload failed:', { message: error.message, teamId });
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
