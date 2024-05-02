/**
 *
 * @param {string} variation The variation name.
 *
 * @return {string} The variation class name.
 */
export function getVariationClassName( variation ) {
	if ( ! variation ) {
		return '';
	}
	return `is-style-${ variation }`;
}

function getFontFamilyFromSetting( fontFamilies, setting ) {
	if ( ! Array.isArray( fontFamilies ) || ! setting ) {
		return null;
	}

	const fontFamilyVariable = setting.replace( 'var(', '' ).replace( ')', '' );
	const fontFamilySlug = fontFamilyVariable?.split( '--' ).slice( -1 )[ 0 ];

	return fontFamilies.find(
		( fontFamily ) => fontFamily.slug === fontFamilySlug
	);
}

export function getFontFamilies( themeJson ) {
	const fontFamilies = themeJson?.settings?.typography?.fontFamilies?.theme; // TODO this could not be under theme.
	const bodyFontFamilySetting = themeJson?.styles?.typography?.fontFamily;
	const bodyFontFamily = getFontFamilyFromSetting(
		fontFamilies,
		bodyFontFamilySetting
	);

	const headingFontFamilySetting =
		themeJson?.styles?.elements?.heading?.typography?.fontFamily;

	let headingFontFamily;
	if ( ! headingFontFamilySetting ) {
		headingFontFamily = bodyFontFamily;
	} else {
		headingFontFamily = getFontFamilyFromSetting(
			fontFamilies,
			themeJson?.styles?.elements?.heading?.typography?.fontFamily
		);
	}

	return [ bodyFontFamily, headingFontFamily ];
}

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
	const shadowString = `${ shadowObj.x || 0 }px ${ shadowObj.y || 0 }px ${
		shadowObj.blur || 0
	}px ${ shadowObj.spread || 0 }px`;
	if ( shadowObj.color ) {
		return `${ shadowString } ${ shadowObj.color }`;
	}
	if ( shadowObj.inset ) {
		return `inset ${ shadowString }`;
	}
	return shadowString;
}
