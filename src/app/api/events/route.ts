import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  // Fallback short poll mode
  if (since !== null) {
    const sinceNum = parseInt(since, 10) || 0;
    const events = serverStore.getEventsSince(sinceNum);
    return NextResponse.json({ events });
  }

  // Server-Sent Events (SSE) stream
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let unregister: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connected frame
      controller.enqueue(encoder.encode(`: connected client ${clientId}\n\n`));

      // Register listener
      unregister = serverStore.registerSSEClient(clientId, (chunk) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Client disconnected
          if (unregister) unregister();
        }
      });

      // Heartbeat ping every 15 seconds to keep connection alive through mobile NAT/gateways
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (unregister) unregister();
        }
      }, 15000);
    },
    cancel() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unregister) unregister();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering if proxied
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;
    if (!type) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }
    const event = serverStore.emitEvent(type, payload);
    return NextResponse.json({ success: true, event });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
