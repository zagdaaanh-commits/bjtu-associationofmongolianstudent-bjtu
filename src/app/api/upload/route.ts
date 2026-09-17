import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const teamId = (formData.get('teamId') as string) || 'unknown';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const fileName = `team_${teamId}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({ url: publicUrl });
    }

    // JSON body with base64 data URL
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const rawData =
        body.dataUrl || body.image || body.base64 || body.photo || body.initial_photo_url;
      const teamId = body.teamId || 'anon';

      if (!rawData || typeof rawData !== 'string') {
        return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
      }

      // If already a public url path, return it directly
      if (rawData.startsWith('/uploads/')) {
        return NextResponse.json({ url: rawData });
      }

      let buffer: Buffer;
      let ext = '.jpg';

      if (rawData.startsWith('data:')) {
        const commaIdx = rawData.indexOf(',');
        if (commaIdx === -1) {
          return NextResponse.json({ error: 'Invalid base64 data URL' }, { status: 400 });
        }
        const meta = rawData.slice(0, commaIdx);
        const base64Data = rawData.slice(commaIdx + 1);

        if (meta.includes('png')) ext = '.png';
        else if (meta.includes('webp')) ext = '.webp';
        else if (meta.includes('gif')) ext = '.gif';

        buffer = Buffer.from(base64Data.trim(), 'base64');
      } else {
        // Raw base64 string
        buffer = Buffer.from(rawData.trim(), 'base64');
      }

      if (!buffer || buffer.length === 0) {
        return NextResponse.json({ error: 'Invalid or empty base64 data' }, { status: 400 });
      }

      const fileName = `team_${teamId}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({ url: publicUrl });
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
