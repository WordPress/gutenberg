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
	// TODO: this function should work with all unite tests
	const colorStart = shadow.indexOf( 'rgb' );
	const pattern = /(?<=\)),?\s*/;
	return shadow
		.split( colorStart !== -1 ? pattern : ',' )
		.map( ( part ) => part.trim() );
}

export function shadowStringToObject( shadow ) {
	// TODO: this function should work with all unite tests
	const colorStart = shadow.indexOf( 'rgb' );
	const inset = shadow.indexOf( 'inset' ) !== -1;
	let parts = [];
	const defaultColor = '#000';
	let { x, y, blur, spread, color } = {
		x: 0,
		y: 0,
		blur: 0,
		spread: 0,
		color: defaultColor,
	};

	if ( colorStart !== -1 ) {
		color = shadow.substring( colorStart );
		parts = shadow.substring( 0, colorStart ).trim().split( ' ' );
	} else {
		parts = shadow.split( ' ' );
		color = parts.pop();
	}

	if ( parts.length === 4 ) {
		x = parseInt( parts[ 0 ].replace( 'px', '' ) );
		y = parseInt( parts[ 1 ].replace( 'px', '' ) );
		blur = parseInt( parts[ 2 ].replace( 'px', '' ) );
		spread = parseInt( parts[ 3 ].replace( 'px', '' ) );
	} else if ( parts.length === 3 ) {
		x = parseInt( parts[ 0 ].replace( 'px', '' ) );
		y = parseInt( parts[ 1 ].replace( 'px', '' ) );
		blur = parseInt( parts[ 2 ].replace( 'px', '' ) );
	} else if ( parts.length === 2 ) {
		x = parseInt( parts[ 0 ].replace( 'px', '' ) );
		y = parseInt( parts[ 1 ].replace( 'px', '' ) );
	} else {
		x = parseInt( parts[ 0 ].replace( 'px', '' ) );
		y = parseInt( parts[ 1 ].replace( 'px', '' ) );
	}

	return { x, y, blur, spread, color, inset };
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
