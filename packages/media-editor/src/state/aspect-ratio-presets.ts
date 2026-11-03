import { __ } from '@wordpress/i18n';

/**
 * An aspect ratio preset with a human-readable label.
 */
export interface AspectRatioPreset {
	/** Display label (e.g., "Square (1:1)"). */
	label: string;
	/**
	 * The aspect ratio value (width / height). 0 = free,
	 * `ORIGINAL_ASPECT_RATIO` = the image's own ratio.
	 */
	value: number;
}

/**
 * Sentinel value for "Original" aspect ratio — resolved at runtime
 * to the image's natural width / height.
 */
export const ORIGINAL_ASPECT_RATIO = -1;

/**
 * The presets the editor offers by default. The labels live here rather
 * than in the image editor package, which has no user-facing strings.
 */
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
