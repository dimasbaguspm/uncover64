const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Mask UUIDs in a URL so telemetry doesn't carry unique asset/compression ids.
 * Handles both /encode/:uuid and /encode/:uuid/compress/:uuid.
 */
export function maskUrl(input: string): string {
  return input.replace(UUID_RE, "[id]");
}
