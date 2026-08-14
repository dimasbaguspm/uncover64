import type { DownscaleOptions } from "../lib/types";

export const IMAGE_MAX_WIDTHS = [256, 512, 1024, 1920, 3840] as const;

export const IMAGE_DEFAULTS: DownscaleOptions = {
  maxWidth: 1024,
  quality: 0.8,
  format: "jpeg",
};

export const QUALITY_MIN = 0.2;
export const QUALITY_MAX = 1;
export const QUALITY_STEP = 0.05;
