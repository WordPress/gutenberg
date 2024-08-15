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
 * Iterates through the presets array and searches for slugs that start with the specified
 * slugPrefix followed by a numerical suffix. It identifies the highest numerical suffix found
 * and returns one greater than the highest found suffix, ensuring that the new index is unique.
 *
 * @param {Array}  presets    The array of preset objects, each potentially containing a slug property.
 * @param {string} slugPrefix The prefix to look for in the preset slugs.
 *
 * @return {number} The next available index for a preset with the specified slug prefix, or 1 if no matching slugs are found.
 */
export function getNewIndexFromPresets( presets, slugPrefix ) {
	const nameRegex = new RegExp( `^${ slugPrefix }([\\d]+)$` );
	const highestPresetValue = presets.reduce( ( currentHighest, preset ) => {
		if ( typeof preset?.slug === 'string' ) {
			const matches = preset?.slug.match( nameRegex );
			if ( matches ) {
				const id = parseInt( matches[ 1 ], 10 );
				if ( id > currentHighest ) {
					return id;
				}
			}
		}
		return currentHighest;
	}, 0 );
	return highestPresetValue + 1;
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
	const themeFontFamilies =
		themeJson?.settings?.typography?.fontFamilies?.theme;
	const customFontFamilies =
		themeJson?.settings?.typography?.fontFamilies?.custom;

	let fontFamilies = [];
	if ( themeFontFamilies && customFontFamilies ) {
		fontFamilies = [ ...themeFontFamilies, ...customFontFamilies ];
	} else if ( themeFontFamilies ) {
		fontFamilies = themeFontFamilies;
	} else if ( customFontFamilies ) {
		fontFamilies = customFontFamilies;
	}
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
