import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExportBar } from "./export-bar";

function renderBar(compressed: Parameters<typeof ExportBar>[0]["compressed"] = null) {
  render(<ExportBar base64="aGk=" mime="text/plain" compressed={compressed} />);
}

describe("ExportBar", () => {
  it("shows the raw base64 by default", () => {
    renderBar();
    expect(screen.getByDisplayValue("aGk=")).toBeInTheDocument();
  });

  it("switches to a data URI", async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole("button", { name: "Data URI" }));
    expect(screen.getByDisplayValue("data:text/plain;base64,aGk=")).toBeInTheDocument();
  });

  it("reveals secret fields and renders k8s YAML", async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole("button", { name: "K8s" }));
    screen.getByDisplayValue(/apiVersion: v1/);
    screen.getByDisplayValue(/kind: Secret/);
    expect(screen.getByDisplayValue("my-secret")).toBeInTheDocument();
  });

  it("edits the secret name and reflects it in the YAML", async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole("button", { name: "K8s" }));
    const nameInput = screen.getByDisplayValue("my-secret");
    await user.clear(nameInput);
    await user.type(nameInput, "renamed");
    expect(screen.getByDisplayValue(/name: renamed/)).toBeInTheDocument();
  });

  it("shows the node snippet for a compressed value", () => {
    renderBar("gzip");
    expect(screen.getByText(/gunzipSync/)).toBeInTheDocument();
  });

  it("switches the snippet to Go", async () => {
    const user = userEvent.setup();
    renderBar("gzip");
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByText(/compress\/gzip/)).toBeInTheDocument();
  });

  it("omits the snippet without a compressed format", () => {
    renderBar();
    expect(screen.queryByText(/gunzipSync/)).not.toBeInTheDocument();
  });
});
