const tint = (name: string) =>
  `bg-[var(--tint-${name}-bg)] text-[var(--tint-${name}-fg)] border-[var(--tint-${name}-bd)]`;

export const KIND_COLORS: Record<string, string> = {
  jwt: tint("amber"),
  json: tint("sky"),
  text: tint("neutral"),
  png: tint("emerald"),
  jpeg: tint("emerald"),
  gif: tint("emerald"),
  webp: tint("emerald"),
  mp4: tint("violet"),
  webm: tint("violet"),
  mkv: tint("violet"),
  avi: tint("violet"),
  mp3: tint("sky"),
  wav: tint("sky"),
  pdf: tint("rose"),
  zip: tint("violet"),
  gzip: tint("violet"),
  wasm: tint("fuchsia"),
  binary: tint("rose"),
  empty: tint("neutral"),
};
