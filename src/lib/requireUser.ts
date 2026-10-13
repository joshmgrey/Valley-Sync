import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type RequireUserResult = { userId: string } | { response: NextResponse };

// Middleware already rejects unauthenticated API requests; handlers check again
// so a middleware misconfiguration fails with a clean 401 instead of a crash.
export async function requireUser(): Promise<RequireUserResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId };
}
