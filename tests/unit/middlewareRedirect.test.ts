/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Stand in for Auth.js: call the wrapped handler with a signed-out request.
jest.mock("@/auth", () => ({
  auth: (handler: (req: unknown) => unknown) => (req: NextRequest) =>
    handler(Object.assign(req, { auth: null })),
}));

import middleware from "@/middleware";

const run = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  (middleware as unknown as (req: NextRequest) => Promise<Response> | Response)(new NextRequest(url, init));

// In production, server.ts starts Next with hostname "localhost", so req.url is
// http://localhost:3000/... even though users reach the app at its public origin.
describe("middleware redirects for signed-out visitors", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.test";
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("sends board pages to the public login URL, not localhost", async () => {
    const res = await run("http://localhost:3000/boards/abc?view=1");
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.origin).toBe("https://app.example.test");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/boards/abc?view=1");
  });

  it("sends the home page to the public login URL", async () => {
    const res = await run("http://localhost:3000/");
    expect(new URL(res.headers.get("location")!).href).toBe("https://app.example.test/login?callbackUrl=%2F");
  });

  it("returns 401 for API routes instead of redirecting", async () => {
    const res = await run("http://localhost:3000/api/boards");
    expect(res.status).toBe(401);
  });

  it("rejects cross-origin mutations against the public origin", async () => {
    const res = await run("http://localhost:3000/api/boards", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });
});
