/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { NormalizedRect, Flip, CropperState } from './types';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 10;

/**
 * Wheel zoom sensitivity. A deltaY of 100 changes zoom by 0.25.
 * This could be made configurable as a prop to the Cropper component.
 */
export const DEFAULT_WHEEL_ZOOM_SPEED = 0.0025;

/** Fine step for keyboard-driven cropper movement, in normalized coordinates. */
export const DEFAULT_KEYBOARD_STEP = 0.01;

/** Coarse keyboard movement multiplier when Shift is held. */
export const KEYBOARD_SHIFT_STEP_MULTIPLIER = 10;

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
	{ label: __( 'Free' ), value: 0 },
	{ label: __( 'Original' ), value: ORIGINAL_ASPECT_RATIO },
	{ label: __( 'Square (1:1)' ), value: 1 },
	{ label: __( 'Landscape (16:9)' ), value: 16 / 9 },
	{ label: __( 'Portrait (9:16)' ), value: 9 / 16 },
	{ label: __( 'Classic (4:3)' ), value: 4 / 3 },
	{ label: __( 'Classic portrait (3:4)' ), value: 3 / 4 },
	{ label: __( 'Photo (3:2)' ), value: 3 / 2 },
	{ label: __( 'Photo portrait (2:3)' ), value: 2 / 3 },
];
