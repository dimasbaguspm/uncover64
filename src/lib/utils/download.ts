export function downloadBlob(blob: Blob, filename: string): void;
export function downloadBlob(bytes: Uint8Array, mime: string, filename: string): void;
export function downloadBlob(
  blobOrBytes: Blob | Uint8Array,
  mimeOrFilename: string,
  maybeFilename?: string,
): void {
  const blob =
    maybeFilename !== undefined
      ? new Blob([blobOrBytes as Uint8Array<ArrayBuffer>], { type: mimeOrFilename })
      : (blobOrBytes as Blob);
  const filename = maybeFilename ?? mimeOrFilename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBase64(base64: string, mime: string, filename: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  downloadBlob(new Blob([bytes], { type: mime }), filename);
}

export function downloadTextFile(name: string, content: string): void {
  downloadBlob(new Blob([content], { type: "text/plain" }), name);
}

export function createObjectUrl(bytes: Uint8Array | ArrayBuffer, mime: string): string {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}
