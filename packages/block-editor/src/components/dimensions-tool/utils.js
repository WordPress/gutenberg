/**
 * Parses a CSS `aspect-ratio` value into a number so that values that are
 * written differently but describe the same ratio, e.g. `1` and `1/1`, can be
 * compared.
 *
 * @param {string} [value] CSS aspect-ratio value, e.g. '16/9' or '1.5'.
 *
 * @return {?number} The ratio as a number, or null when it cannot be parsed.
 */
export function parseAspectRatio( value ) {
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
 * @param {string}   value   CSS aspect-ratio value.
 * @param {Object[]} options Aspect ratio options.
 *
 * @return {?Object} The matching option, or null when there is none.
 */
export function findAspectRatioOption( value, options ) {
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
