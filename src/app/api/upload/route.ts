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
      const { dataUrl, teamId } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Invalid base64 data URL' }, { status: 400 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';

      const fileName = `team_${teamId || 'anon'}_${Date.now()}${ext}`;
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
