/**
 * Type definition for aspect ratio.
 */
export interface AspectRatio {
	/** Display label (e.g., "16:9", "1:1") */
	label: string;
	/** Numeric value of the ratio (width/height) */
	value: number;
}

/**
 * Calculates the aspect ratio of an image.
 *
 * @param width  - Image width in pixels
 * @param height - Image height in pixels
 * @return The aspect ratio (width/height)
 */
export function getImageAspectRatio( width: number, height: number ): number {
	if ( height === 0 ) {
		return 1;
	}
	return width / height;
}

/**
 * Returns common aspect ratio presets.
 *
 * @return Array of aspect ratio objects
 */
export function getCommonAspectRatios(): AspectRatio[] {
	return [
		{ label: 'Original', value: 0 }, // 0 means use original aspect ratio
		{ label: '1:1', value: 1 },
		{ label: '16:9', value: 16 / 9 },
		{ label: '4:3', value: 4 / 3 },
		{ label: '3:2', value: 3 / 2 },
		{ label: '3:4', value: 3 / 4 },
		{ label: '2:3', value: 2 / 3 },
	];
}

/**
 * Converts a ratio string to a numeric value.
 *
 * @param ratio - Ratio string (e.g., "16:9")
 * @return The numeric ratio value (width/height)
 */
export function ratioToNumber( ratio: string ): number {
	const parts = ratio.split( ':' );
	if ( parts.length !== 2 ) {
		return 1;
	}
	const width = parseFloat( parts[ 0 ] );
	const height = parseFloat( parts[ 1 ] );
	if ( isNaN( width ) || isNaN( height ) || height === 0 ) {
		return 1;
	}
	return width / height;
}

/**
 * Finds the closest matching ratio from a list of presets.
 *
 * @param actual - The actual aspect ratio to match
 * @param ratios - Array of preset aspect ratios
 * @return The closest matching ratio, or the first ratio if none match
 */
export function findClosestRatio(
	actual: number,
	ratios: AspectRatio[]
): AspectRatio {
	if ( ratios.length === 0 ) {
		return { label: '1:1', value: 1 };
	}

	let closest = ratios[ 0 ];
	let minDiff = Math.abs( actual - closest.value );

	for ( const ratio of ratios ) {
		// Skip "Original" (value 0) when finding closest match
		if ( ratio.value === 0 ) {
			continue;
		}
		const diff = Math.abs( actual - ratio.value );
		if ( diff < minDiff ) {
			minDiff = diff;
			closest = ratio;
		}
	}

	return closest;
}
