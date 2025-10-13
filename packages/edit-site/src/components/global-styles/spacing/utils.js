/**
 * Parses a clamp() CSS function and extracts min, preferred, and max values.
 *
 * @param {string} value The CSS value to parse.
 * @return {Object|null} Object with min, preferred, max properties or null if not a clamp function.
 */
export function parseClampValue( value ) {
	if ( ! value || typeof value !== 'string' ) {
		return null;
	}

	// Match clamp(min, preferred, max) pattern
	const clampMatch = value.match(
		/^clamp\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)$/
	);
	if ( clampMatch ) {
		return {
			min: clampMatch[ 1 ].trim(),
			preferred: clampMatch[ 2 ].trim(),
			max: clampMatch[ 3 ].trim(),
		};
	}

	return null;
}

/**
 * Generates a clamp() CSS function from min, preferred, and max values.
 *
 * @param {string} min       The minimum value.
 * @param {string} preferred The preferred value.
 * @param {string} max       The maximum value.
 * @return {string} The clamp() CSS function or empty string if invalid.
 */
export function generateClampValue( min, preferred, max ) {
	if ( ! min || ! preferred || ! max ) {
		return '';
	}
	return `clamp(${ min }, ${ preferred }, ${ max })`;
}

/**
 * Parses a CSS value that may contain comparison functions (clamp, min, max)
 * and returns both a display value and a preview value suitable for rendering.
 *
 * @param {string} value The CSS value to parse.
 * @return {Object} Object with displayValue and previewValue properties.
 */
export function parseComparisonValue( value ) {
	if ( ! value || typeof value !== 'string' ) {
		return { displayValue: value, previewValue: value };
	}

	// Check if the value is a clamp() function
	const clampMatch = value.match(
		/^clamp\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)$/
	);
	if ( clampMatch ) {
		const min = clampMatch[ 1 ].trim();
		const preferred = clampMatch[ 2 ].trim();
		const max = clampMatch[ 3 ].trim();
		return {
			displayValue: `${ min } → ${ max }`,
			previewValue: preferred,
		};
	}

	// Check if the value is a min() function
	const minMatch = value.match( /^min\(\s*([^,]+)(?:\s*,\s*([^)]+))?\s*\)$/ );
	if ( minMatch ) {
		const values = [ minMatch[ 1 ].trim(), minMatch[ 2 ]?.trim() ]
			.filter( Boolean )
			.join( ', ' );
		return {
			displayValue: `min( ${ values } )`,
			previewValue: minMatch[ 1 ].trim(),
		};
	}

	// Check if the value is a max() function
	const maxMatch = value.match( /^max\(\s*([^,]+)(?:\s*,\s*([^)]+))?\s*\)$/ );
	if ( maxMatch ) {
		const values = [ maxMatch[ 1 ].trim(), maxMatch[ 2 ]?.trim() ]
			.filter( Boolean )
			.join( ', ' );
		return {
			displayValue: `max( ${ values } )`,
			previewValue: maxMatch[ 1 ].trim(),
		};
	}

	// Return the value as-is if it doesn't match any pattern
	return { displayValue: value, previewValue: value };
}

/**
 * Determines if any spacing sizes are available to display from settings.
 *
 * @param {Object} settings Settings object from useSettingsForBlockElement.
 * @return {boolean} True if there are spacing sizes available.
 */
export function hasAvailableSpacingSizes( settings ) {
	const spacingSizes = settings?.spacing?.spacingSizes;
	const defaultEnabled = settings?.spacing?.defaultSpacingSizes;

	if ( ! spacingSizes ) {
		return false;
	}

	return (
		( spacingSizes.custom && spacingSizes.custom.length > 0 ) ||
		( spacingSizes.theme && spacingSizes.theme.length > 0 ) ||
		( spacingSizes.default &&
			spacingSizes.default.length > 0 &&
			defaultEnabled !== false )
	);
}
