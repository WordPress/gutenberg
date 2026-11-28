import type { DimensionsToolOption } from './types';

/**
 * Matches a number of pixels as it is typed in a field, without the unit.
 */
export const PIXEL_AMOUNT_REGEXP = /^\d+(?:\.\d+)?$/;

/**
 * Gets the number of pixels in a CSS length, so that it can be edited in a
 * field that only accepts pixels.
 *
 * @param value CSS length, e.g. '800px'. Unitless numbers are pixels.
 *
 * @return The number of pixels without the unit, an empty string when there
 *         is no value, or null when the value uses another unit.
 */
export function getPixelAmount( value?: string | null ): string | null {
	if ( ! value ) {
		return '';
	}

	const amount = value.trim().replace( /px$/, '' );

	return PIXEL_AMOUNT_REGEXP.test( amount ) ? amount : null;
}

/**
 * Parses a CSS `aspect-ratio` value into a number so that values that are
 * written differently but describe the same ratio, e.g. `1` and `1/1`, can be
 * compared.
 *
 * @param value CSS aspect-ratio value, e.g. '16/9' or '1.5'.
 *
 * @return The ratio as a number, or null when it cannot be parsed.
 */
export function parseAspectRatio( value?: unknown ): number | null {
	if ( typeof value !== 'string' ) {
		return null;
	}

	const parts = value.split( '/' );

	if ( parts.length > 2 ) {
		return null;
	}

	const [ width, height = '1' ] = parts;
	const numericWidth = Number( width.trim() );
	const numericHeight = Number( height.trim() );

	if (
		! Number.isFinite( numericWidth ) ||
		! Number.isFinite( numericHeight ) ||
		numericWidth <= 0 ||
		numericHeight <= 0
	) {
		return null;
	}

	return numericWidth / numericHeight;
}

/**
 * Finds the option that represents the given CSS `aspect-ratio` value.
 *
 * Aspect ratio values are free-form CSS, while the options are a fixed list of
 * presets, so an exact string match isn't enough: `1/1` and `1` describe the
 * same ratio but only one of them is a preset value.
 *
 * @param value   CSS aspect-ratio value.
 * @param options Aspect ratio options.
 *
 * @return The matching option, or null when there is none.
 */
export function findAspectRatioOption(
	value: string,
	options: DimensionsToolOption[]
): DimensionsToolOption | null {
	const exactMatch = options.find( ( option ) => option.value === value );

	if ( exactMatch ) {
		return exactMatch;
	}

	const ratio = parseAspectRatio( value );

	if ( ratio === null ) {
		return null;
	}

	return (
		options.find(
			( option ) => parseAspectRatio( option.value ) === ratio
		) ?? null
	);
}
