import { describe, expect, it } from "vitest";
import { maskUrl } from "./mask";

describe("maskUrl", () => {
  it("masks encode asset uuids", () => {
    expect(
      maskUrl("https://uncover64.dimasbaguspm.dev/encode/89b606b6-bcab-4c01-9c21-1d6cb7164d20"),
    ).toBe("https://uncover64.dimasbaguspm.dev/encode/[id]");
  });

  it("masks both uuids in encode/compress paths", () => {
    expect(
      maskUrl(
        "https://uncover64.dimasbaguspm.dev/encode/89b606b6-bcab-4c01-9c21-1d6cb7164d20/compress/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      ),
    ).toBe("https://uncover64.dimasbaguspm.dev/encode/[id]/compress/[id]");
  });

  it("leaves plain paths unchanged", () => {
    expect(maskUrl("/decode")).toBe("/decode");
  });
});
