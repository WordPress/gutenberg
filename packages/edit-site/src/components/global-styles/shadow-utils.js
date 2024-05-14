export const CUSTOM_VALUE_SETTINGS = {
	px: { max: 20, step: 1 },
	'%': { max: 100, step: 1 },
	vw: { max: 100, step: 1 },
	vh: { max: 100, step: 1 },
	em: { max: 10, step: 0.1 },
	rm: { max: 10, step: 0.1 },
	svw: { max: 100, step: 1 },
	lvw: { max: 100, step: 1 },
	dvw: { max: 100, step: 1 },
	svh: { max: 100, step: 1 },
	lvh: { max: 100, step: 1 },
	dvh: { max: 100, step: 1 },
	vi: { max: 100, step: 1 },
	svi: { max: 100, step: 1 },
	lvi: { max: 100, step: 1 },
	dvi: { max: 100, step: 1 },
	vb: { max: 100, step: 1 },
	svb: { max: 100, step: 1 },
	lvb: { max: 100, step: 1 },
	dvb: { max: 100, step: 1 },
	vmin: { max: 100, step: 1 },
	svmin: { max: 100, step: 1 },
	lvmin: { max: 100, step: 1 },
	dvmin: { max: 100, step: 1 },
	vmax: { max: 100, step: 1 },
	svmax: { max: 100, step: 1 },
	lvmax: { max: 100, step: 1 },
	dvmax: { max: 100, step: 1 },
};

export function getShadowParts( shadow ) {
	const shadowValues = shadow.match( /(?:[^,(]|\([^)]*\))+/g ) || [];
	return shadowValues.map( ( value ) => value.trim() );
}

export function shadowStringToObject( shadowValue ) {
	/*
	 * Shadow spec: https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow
	 * Shadow string format: <offset-x> <offset-y> <blur-radius> <spread-radius> <color> [inset]
	 *
	 * A shadow to be valid it must satisfy the following.
	 *
	 * 1. Should not contain "none" keyword.
	 * 2. Values x, y, blur, spread should be in the order. Color and inset can be anywhere in the string except in between x, y, blur, spread values.
	 * 3. Should not contain more than one set of x, y, blur, spread values.
	 * 4. Should contain at least x and y values. Others are optional.
	 * 5. Should not contain more than one "inset" (case insensitive) keyword.
	 * 6. Should not contain more than one color value.
	 */

	const defaultShadow = {
		x: '0',
		y: '0',
		blur: '0',
		spread: '0',
		color: '#000',
		inset: false,
	};

	if ( ! shadowValue ) {
		return defaultShadow;
	}

	// Rule 1: Should not contain "none" keyword.
	// if the shadow has "none" keyword, it is not a valid shadow string
	if ( shadowValue.includes( 'none' ) ) {
		return defaultShadow;
	}

	// Rule 2: Values x, y, blur, spread should be in the order.
	//		   Color and inset can be anywhere in the string except in between x, y, blur, spread values.
	// Extract length values (x, y, blur, spread) from shadow string
	// Regex match groups of 1 to 4 length values.
	const lengthsRegex =
		/((?:^|\s+)(-?\d*\.?\d+(?:px|%|in|cm|mm|em|rem|ex|pt|pc|vh|vw|vmin|vmax|ch|lh)?)(?=\s|$)(?![^(]*\))){1,4}/g;
	const matches = shadowValue.match( lengthsRegex ) || [];

	// Rule 3: Should not contain more than one set of x, y, blur, spread values.
	// if the string doesn't contain exactly 1 set of x, y, blur, spread values,
	// it is not a valid shadow string
	if ( matches.length !== 1 ) {
		return defaultShadow;
	}

	// Extract length values (x, y, blur, spread) from shadow string
	const lengths = matches[ 0 ]
		.split( ' ' )
		.map( ( value ) => value.trim() )
		.filter( ( value ) => value );

	// Rule 4: Should contain at least x and y values. Others are optional.
	if ( lengths.length < 2 ) {
		return defaultShadow;
	}

	// Rule 5: Should not contain more than one "inset" (case insensitive) keyword.
	// check if the shadow string contains "inset" keyword
	const insets = shadowValue.match( /inset/gi ) || [];
	if ( insets.length > 1 ) {
		return defaultShadow;
	}

	// Strip lengths and inset from shadow string, leaving just color.
	const hasInset = insets.length === 1;
	let colorString = shadowValue.replace( lengthsRegex, '' ).trim();
	if ( hasInset ) {
		colorString = colorString
			.replace( 'inset', '' )
			.replace( 'INSET', '' )
			.trim();
	}

	// Rule 6: Should not contain more than one color value.
	// validate color string with regular expression
	// check if color has matching hex, rgb or hsl values
	const colorRegex =
		/^#([0-9a-f]{3}){1,2}$|^#([0-9a-f]{4}){1,2}$|^(?:rgb|hsl)a?\(?[\d*\.?\d+%?,?\/?\s]*\)$/gi;
	let colorMatches = ( colorString.match( colorRegex ) || [] )
		.map( ( value ) => value?.trim() )
		.filter( ( value ) => value );

	// If color string has more than one color values, it is not a valid
	if ( colorMatches.length > 1 ) {
		return defaultShadow;
	} else if ( colorMatches.length === 0 ) {
		// check if color string has multiple named color values separated by space
		colorMatches = colorString
			.trim()
			.split( ' ' )
			.filter( ( value ) => value );
		// If color string has more than one color values, it is not a valid
		if ( colorMatches.length > 1 ) {
			return defaultShadow;
		}
	}

	// Return parsed shadow object.
	const [ x, y, blur, spread ] = lengths;
	return {
		x,
		y,
		blur: blur || defaultShadow.blur,
		spread: spread || defaultShadow.spread,
		inset: hasInset,
		color: colorString || defaultShadow.color,
	};
}

export function shadowObjectToString( shadowObj ) {
	const shadowString = `${ shadowObj.x || '0px' } ${ shadowObj.y || '0px' } ${
		shadowObj.blur || '0px'
	} ${ shadowObj.spread || '0px' }`;

	return `${ shadowObj.inset ? 'inset' : '' } ${ shadowString } ${
		shadowObj.color || ''
	}`.trim();
}
