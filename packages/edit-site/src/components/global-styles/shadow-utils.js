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
	const defaultShadow = {
		x: '0',
		y: '0',
		blur: '0',
		spread: '0',
		color: '#000',
		inset: false,
	};

	// Step 1: Check for "none" keyword
	if ( shadowValue.includes( 'none' ) ) {
		return defaultShadow;
	}

	// Step 2: Extract length values (x, y, blur, spread) from shadow string
	const lengthsRegex =
		/(?:^|\s)(-?\d*\.?\d+(?:px|%|in|cm|mm|em|rem|ex|pt|pc|vh|vw|vmin|vmax|ch|lh)?)(?=\s|$)(?![^(]*\))/g;
	const matches = shadowValue.match( lengthsRegex ) || [];
	const lengths = matches.slice( 0, 4 );

	// Step 3: Check if there are at least 2 length values (x, y are required for string to be valid shadow)
	if ( lengths.length < 2 ) {
		return defaultShadow;
	}

	// Step 4: Check for `inset`
	const inset = shadowValue.includes( 'inset' );

	// Step 5. Strip lengths and inset from shadow string, leaving just color.
	let colorString = shadowValue.replace( lengthsRegex, '' ).trim();
	if ( inset ) {
		colorString = colorString.replace( 'inset', '' ).trim();
	}

	// Step 6. Create and return parsed shadow object.
	const [ x, y, blur, spread ] = lengths;
	return {
		x: x?.trim(),
		y: y?.trim(),
		blur: blur?.trim() || defaultShadow.blur,
		spread: spread?.trim() || defaultShadow.spread,
		inset,
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
