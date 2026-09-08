import { NextResponse } from "next/server";

/**
 * Unauthenticated liveness probe for the ALB target group.
 *
 * Deliberately does not touch the database — a transient RDS blip should not
 * make the load balancer kill an otherwise-healthy task. It only confirms the
 * Node process is up and serving HTTP.
 *
 * Not covered by the middleware matcher, so it stays public.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
