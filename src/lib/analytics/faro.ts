import { initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { ANALYTICS } from "../../constants/analytics";

export function initFaro(): void {
  const { faroCollectorUrl } = ANALYTICS;
  if (!faroCollectorUrl) return;
  initializeFaro({
    url: faroCollectorUrl,
    app: { name: "uncover64" },
    instrumentations: [new TracingInstrumentation()],
  });
}
