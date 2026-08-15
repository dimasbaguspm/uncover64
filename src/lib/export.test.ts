import { describe, expect, it } from "vitest";
import { exportValue, toDataUri, toEnvSafe, toK8sSecretYAML } from "./export";
import { formatBytes, prettyJson, savingsPercent } from "@/lib/utils/format";

describe("formatBytes", () => {
  it("formats units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024 * 3.5)).toBe("3.5 MB");
  });
});

describe("percent helpers", () => {
  it("computes savings", () => {
    expect(savingsPercent(300, 1000)).toBe(70);
    expect(savingsPercent(1500, 1000)).toBe(-50);
    expect(savingsPercent(100, 0)).toBe(0);
  });
});

describe("data URI", () => {
  it("builds a data URI", () => {
    expect(toDataUri("aGk=", "image/png")).toBe("data:image/png;base64,aGk=");
  });
});

describe("env-safe output", () => {
  it("wraps to 64-char lines", () => {
    const base64 = "A".repeat(128);
    const lines = toEnvSafe(base64).split("\n");
    expect(lines).toEqual([base64.slice(0, 64), base64.slice(64)]);
    expect(lines.join("")).toBe(base64);
  });
});

describe("k8s secret yaml", () => {
  it("wraps base64 in stringData", () => {
    const yaml = toK8sSecretYAML("my-secret", "data", "aGk=");
    expect(yaml).toContain("kind: Secret");
    expect(yaml).toContain("name: my-secret");
    expect(yaml).toContain("stringData:");
    expect(yaml).toContain("  data: |");
    expect(yaml).toContain("    aGk=");
  });
});

describe("exportValue", () => {
  it("selects the right format", () => {
    expect(exportValue("raw", "aGk=", "text/plain", "s", "k")).toBe("aGk=");
    expect(exportValue("datauri", "aGk=", "text/plain", "s", "k")).toBe(
      "data:text/plain;base64,aGk=",
    );
    expect(exportValue("env", "aGk=", "text/plain", "s", "k")).toBe("aGk=");
    expect(exportValue("k8s", "aGk=", "text/plain", "s", "k")).toContain("kind: Secret");
  });
});

describe("prettyJson", () => {
  it("pretty-prints JSON", () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it("returns raw on parse failure", () => {
    expect(prettyJson("not json")).toBe("not json");
  });
});
