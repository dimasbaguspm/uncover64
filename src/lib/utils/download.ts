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

export function downloadBase64(base64: string, mime: string, filename: string): void;
export function downloadBase64(name: string, base64: string): void;
export function downloadBase64(
  base64OrName: string,
  mimeOrBase64: string,
  maybeFilename?: string,
): void {
  if (maybeFilename !== undefined) {
    const bytes = Uint8Array.from(atob(base64OrName), (c) => c.charCodeAt(0));
    downloadBlob(new Blob([bytes], { type: mimeOrBase64 }), maybeFilename);
  } else {
    downloadBlob(new Blob([mimeOrBase64], { type: "text/plain" }), base64OrName);
  }
}

export function createObjectUrl(bytes: Uint8Array | ArrayBuffer, mime: string): string {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}
