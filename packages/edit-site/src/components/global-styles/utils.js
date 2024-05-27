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

/**
 * Returns a new index based on the presets and slug prefix.
 *
 * @param {Array}  presets    The array of presets.
 * @param {string} slugPrefix The prefix for the slug.
 *
 * @return {number} The new index.
 */
export function getNewIndexFromPresets( presets, slugPrefix ) {
	const nameRegex = new RegExp( `^${ slugPrefix }([\\d]+)$` );
	return presets.reduce( ( previousValue, currentValue ) => {
		if ( typeof currentValue?.slug === 'string' ) {
			const matches = currentValue?.slug.match( nameRegex );
			if ( matches ) {
				const id = parseInt( matches[ 1 ], 10 );
				if ( id >= previousValue ) {
					return id + 1;
				}
			}
		}
		return previousValue;
	}, 1 );
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
