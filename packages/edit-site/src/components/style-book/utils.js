/**
 * Returns a value rounded to defined precision.
 * Returns `undefined` if the value is not a valid finite number.
 *
 * @param {number} value  Raw value.
 * @param {number} digits The number of digits to appear after the decimal point
 *
 * @return {number|undefined} Value rounded to standard precision.
 */
export function roundToPrecision( value, digits = 3 ) {
	const base = Math.pow( 10, digits );
	return Number.isFinite( value )
		? parseFloat( Math.round( value * base ) / base )
		: undefined;
}

/**
 * Converts a value to a pixel value.
 *
 * @param {string|number} rawValue A raw CSS value to convert to `px`.
 * @return {number} The value in pixels.
 */
export function getValueAsPx( rawValue ) {
	if ( typeof rawValue !== 'string' && typeof rawValue !== 'number' ) {
		return null;
	}

	// Converts numeric values to pixel values by default.
	if ( isFinite( rawValue ) ) {
		rawValue = `${ rawValue }px`;
	}

	const rootSizeValue = 16;
	const acceptableUnits = [ 'rem', 'px', 'em' ];

	const acceptableUnitsGroup = acceptableUnits?.join( '|' );
	const regexUnits = new RegExp(
		`^(\\d*\\.?\\d+)(${ acceptableUnitsGroup }){1,1}$`
	);

	const matches = rawValue.match( regexUnits );

	// We need a number value and a unit.
	if ( ! matches || matches.length < 3 ) {
		return null;
	}

	let [ , value, unit ] = matches;

	let returnValue = parseFloat( value );

	if ( 'em' === unit || 'rem' === unit ) {
		returnValue = returnValue * rootSizeValue;
		unit = 'px';
	}

	return returnValue;
}

export function getMarginBoxValuesFromCSSShadowValue( cssShadowValue ) {
	// Strip all the values inside parentheses.
	const filteredValue = cssShadowValue.replace( /\(.*?\)/g, '' );

	// Split by comma if multiple shadows are in use.
	const shadowValues = filteredValue.split( ',' );

	let marginLeft = 0;
	let marginRight = 0;
	let marginTop = 0;
	let marginBottom = 0;
	let blurRadius = 0;

	const output = {
		left: marginLeft,
		right: marginRight,
		top: marginTop,
		bottom: marginBottom,
	};

	// Iterate over each shadow value.
	shadowValues.forEach( ( shadowValue ) => {
		// Split by space, and only extract the first three elements (x-offset, y-offset, blur-radius).
		const shadowValueParts = shadowValue.trim().split( ' ' ).slice( 0, 3 );

		if (
			shadowValueParts.every( ( part ) =>
				part.match( /([-0-9.]+)(px|em|rem)/ )
			)
		) {
			const xOffset = getValueAsPx( shadowValueParts[ 0 ] ) || 0;
			const yOffset = getValueAsPx( shadowValueParts[ 1 ] ) || 0;
			const currentBlurRadius =
				getValueAsPx( shadowValueParts[ 2 ] ) || 0;

			if ( currentBlurRadius > blurRadius ) {
				blurRadius = currentBlurRadius;
			}

			if ( xOffset - blurRadius < marginLeft ) {
				marginLeft = xOffset - blurRadius;
			}

			if ( yOffset - blurRadius < marginTop ) {
				marginTop = xOffset - blurRadius;
			}

			if ( yOffset + blurRadius > marginBottom ) {
				marginBottom = yOffset + blurRadius;
			}

			if ( xOffset + blurRadius > marginRight ) {
				marginRight = xOffset + blurRadius;
			}

			if (
				marginLeft ||
				marginRight ||
				marginTop ||
				marginBottom ||
				blurRadius
			) {
				output.left = Math.abs( marginLeft ) + 'px';
				output.right = Math.abs( marginRight ) + 'px';
				output.top = Math.abs( marginTop ) + 'px';
				output.bottom = Math.abs( marginBottom ) + 'px';
			}
		}
	} );

	return output;
}
