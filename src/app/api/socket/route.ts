/**
 * Socket.io handshake endpoint.
 *
 * Next.js App Router doesn't expose the raw Node HTTP server, so Socket.io
 * must be initialized in a custom server (server.ts). This route exists as a
 * no-op so the /api/socket path resolves — the actual upgrade happens in the
 * custom server before Next.js handles the request.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
