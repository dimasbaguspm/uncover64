import { initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { ANALYTICS } from "../../constants/analytics";

export function initFaro(): void {
  const { otelUrl } = ANALYTICS;
  if (!otelUrl) return;
  initializeFaro({
    url: `${otelUrl}/v1/traces`,
    app: { name: "uncover64" },
    instrumentations: [new TracingInstrumentation()],
  });
}
