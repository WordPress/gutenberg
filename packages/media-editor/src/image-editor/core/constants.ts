/**
 * Internal dependencies
 */
import type { NormalizedRect, Flip, CropperState } from './types';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 10;

/**
 * Minimum zoom while a handle-driven resize is in progress.
 *
 * Below 1, the image renders smaller than its classic contain-fit so
 * the growing crop rect can still frame it. 0.1 is an arbitrary lower
 * bound — far below anything the UX would reach, but finite to avoid
 * divide-by-zero in coverage math.
 */
export const MIN_ZOOM_RESIZING = 0.1;

/**
 * Maximum free-rotation offset in degrees from the nearest 90° step.
 * The rotation slider allows ±45° around the current cardinal angle.
 */
export const MAX_ROTATION_OFFSET = 45;

const DEFAULT_CROP_RECT: NormalizedRect = {
	x: 0,
	y: 0,
	width: 1,
	height: 1,
};

const DEFAULT_FLIP: Flip = {
	horizontal: false,
	vertical: false,
};

const DEFAULT_PAN: { x: number; y: number } = {
	x: 0,
	y: 0,
};

export const DEFAULT_STATE: CropperState = {
	image: null,
	pan: { ...DEFAULT_PAN },
	zoom: MIN_ZOOM,
	rotation: 0,
	basePan: { ...DEFAULT_PAN },
	baseZoom: MIN_ZOOM,
	baseRotation: 0,
	flip: { ...DEFAULT_FLIP },
	cropRect: { ...DEFAULT_CROP_RECT },
	isResizing: false,
};

/**
 * An aspect ratio preset with a human-readable label.
 */
export interface AspectRatioPreset {
	/** Display label (e.g., "Square (1:1)"). */
	label: string;
	/** The aspect ratio value (width / height). 0 = free / original. */
	value: number;
}

/**
 * Default aspect ratio presets. Consumers can use these as-is, override
 * with their own list, or extend with additional presets.
 *
 * @example
 * // Use defaults:
 * <CropControls presets={ DEFAULT_ASPECT_RATIOS } />
 *
 * // Custom presets:
 * const socialPresets = [
 *   { label: 'Instagram Post', value: 1 },
 *   { label: 'Instagram Story', value: 9 / 16 },
 *   { label: 'YouTube Thumbnail', value: 16 / 9 },
 * ];
 *
 * // Extend defaults:
 * const extended = [ ...DEFAULT_ASPECT_RATIOS, { label: 'Cinema (21:9)', value: 21 / 9 } ];
 */
/**
 * Sentinel value for "Original" aspect ratio — resolved at runtime
 * to the image's natural width / height.
 */
export const ORIGINAL_ASPECT_RATIO = -1;

export const DEFAULT_ASPECT_RATIOS: AspectRatioPreset[] = [
	{ label: 'Free', value: 0 },
	{ label: 'Original', value: ORIGINAL_ASPECT_RATIO },
	{ label: 'Square (1:1)', value: 1 },
	{ label: 'Landscape (16:9)', value: 16 / 9 },
	{ label: 'Portrait (9:16)', value: 9 / 16 },
	{ label: 'Classic (4:3)', value: 4 / 3 },
	{ label: 'Classic portrait (3:4)', value: 3 / 4 },
	{ label: 'Photo (3:2)', value: 3 / 2 },
	{ label: 'Photo portrait (2:3)', value: 2 / 3 },
];
