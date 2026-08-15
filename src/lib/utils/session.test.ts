import { describe, expect, it } from "vitest";
import { getSession } from "./session";

describe("getSession", () => {
  it("returns a stable non-empty session id across calls", () => {
    const a = getSession();
    const b = getSession();
    expect(a.sessionId).toBe(b.sessionId);
    expect(a.sessionId.length).toBeGreaterThan(0);
  });

  it("includes referrer and utm fields", () => {
    const s = getSession();
    expect(typeof s.referrer).toBe("string");
    expect(typeof s.utm).toBe("object");
  });
});
