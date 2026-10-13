import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Next.js only loads middleware from src/middleware.ts in a src/ project; a
// root-level middleware.ts is silently ignored, which disables auth and CSRF.
const root = join(__dirname, "..", "..");

describe("middleware location", () => {
  it("lives in src/, next to app/", () => {
    expect(existsSync(join(root, "src", "middleware.ts"))).toBe(true);
  });

  it("has no root-level copy that Next.js would ignore", () => {
    expect(existsSync(join(root, "middleware.ts"))).toBe(false);
  });

  it("protects the home page, boards, and every API route except auth", () => {
    const source = readFileSync(join(root, "src", "middleware.ts"), "utf8");
    for (const route of ['"/"', '"/boards/:path*"', '"/api/boards/:path*"', '"/api/tasks/:path*"', '"/api/socket/:path*"']) {
      expect(source).toContain(route);
    }
  });
});
