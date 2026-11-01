/**
 * Suggested row heights for hosts that offer a small, medium or large
 * choice. The dashboard honors any positive `rowHeight`; these are starting
 * points, not the only values.
 */
export const ROW_HEIGHT_PRESETS = {
	small: 200,
	medium: 300,
	large: 400,
} as const;

export type RowHeightPreset = keyof typeof ROW_HEIGHT_PRESETS;

export const DEFAULT_ROW_HEIGHT = ROW_HEIGHT_PRESETS.medium;
