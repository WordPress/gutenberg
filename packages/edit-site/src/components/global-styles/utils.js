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
