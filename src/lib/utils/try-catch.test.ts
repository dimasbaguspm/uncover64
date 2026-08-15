import { afterEach, describe, expect, it, vi } from "vitest";
import { tryCatch } from "./try-catch";

vi.mock("@/lib/analytics/otel", () => ({
  logError: vi.fn().mockResolvedValue(undefined),
}));

import { logError } from "@/lib/analytics/otel";

afterEach(() => vi.mocked(logError).mockClear());

describe("tryCatch", () => {
  it("returns the value on success", async () => {
    const res = await tryCatch(() => 42);
    expect(res).toBe(42);
  });

  it("logs failures to OTEL with the default message", async () => {
    await tryCatch(() => Promise.reject(new Error("boom")));
    expect(vi.mocked(logError)).toHaveBeenCalledWith(expect.any(Error), "Operation failed");
  });

  it("logs failures with a custom message", async () => {
    await tryCatch(() => Promise.reject(new Error("Input is not valid base64")), {
      message: "Decode failed",
    });
    expect(vi.mocked(logError)).toHaveBeenCalledWith(expect.any(Error), "Decode failed");
  });

  it("skips logging when log is false", async () => {
    await tryCatch(() => Promise.reject(new Error("quiet")), { log: false });
    expect(vi.mocked(logError)).not.toHaveBeenCalled();
  });
});
