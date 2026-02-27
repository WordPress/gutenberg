/**
 * WordPress dependencies
 */
import { areGlobalStylesEqual } from '@wordpress/global-styles-engine';
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

/**
 * Removes all instances of properties from an object.
 *
 * @param object     The object to remove the properties from.
 * @param properties The properties to remove.
 * @return The modified object.
 */
export function removePropertiesFromObject(
	object: any,
	properties: string[]
): any {
	if ( ! properties?.length ) {
		return object;
	}

	if (
		typeof object !== 'object' ||
		! object ||
		! Object.keys( object ).length
	) {
		return object;
	}

	for ( const key in object ) {
		if ( properties.includes( key ) ) {
			delete object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			removePropertiesFromObject( object[ key ], properties );
		}
	}
	return object;
}

/**
 * Returns a new object, with properties specified in `properties` array.,
 * maintain the original object tree structure.
 * The function is recursive, so it will perform a deep search for the given properties.
 * E.g., the function will return `{ a: { b: { c: { test: 1 } } } }` if the properties are  `[ 'test' ]`.
 *
 * @param object     The object to filter
 * @param properties The properties to filter by
 * @return The merged object.
 */
export const filterObjectByProperties = (
	object: any,
	properties: string[]
): any => {
	if ( ! object || ! properties?.length ) {
		return {};
	}

	const newObject: any = {};
	Object.keys( object ).forEach( ( key ) => {
		if ( properties.includes( key ) ) {
			newObject[ key ] = object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			const newFilter = filterObjectByProperties(
				object[ key ],
				properties
			);
			if ( Object.keys( newFilter ).length ) {
				newObject[ key ] = newFilter;
			}
		}
	} );
	return newObject;
};

/**
 * Compares a style variation to the same variation filtered by the specified properties.
 * Returns true if the variation contains only the properties specified.
 *
 * @param variation  The variation to compare.
 * @param properties The properties to compare.
 * @return Whether the variation contains only the specified properties.
 */
export function isVariationWithProperties(
	variation: GlobalStylesConfig,
	properties: string[]
): boolean {
	const variationWithProperties = filterObjectByProperties(
		structuredClone( variation ),
		properties
	);

	return areGlobalStylesEqual( variationWithProperties, variation );
}

function getFontFamilyFromSetting( fontFamilies: any[], setting: string ): any {
	if ( ! Array.isArray( fontFamilies ) || ! setting ) {
		return null;
	}

	const fontFamilyVariable = setting.replace( 'var(', '' ).replace( ')', '' );
	const fontFamilySlug = fontFamilyVariable?.split( '--' ).slice( -1 )[ 0 ];

	return fontFamilies.find(
		( fontFamily ) => fontFamily.slug === fontFamilySlug
	);
}

/**
 * Extracts font families from a theme JSON configuration.
 *
 * @param themeJson The theme JSON configuration
 * @return Array containing [bodyFontFamily, headingFontFamily]
 */
export function getFontFamilies( themeJson: any ): [ any, any ] {
	const themeFontFamilies =
		themeJson?.settings?.typography?.fontFamilies?.theme;
	const customFontFamilies =
		themeJson?.settings?.typography?.fontFamilies?.custom;

	let fontFamilies: any[] = [];
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

function findNearest( input: number, numbers: number[] ): number | null {
	// If the numbers array is empty, return null
	if ( numbers.length === 0 ) {
		return null;
	}
	// Sort the array based on the absolute difference with the input
	numbers.sort( ( a, b ) => Math.abs( input - a ) - Math.abs( input - b ) );
	// Return the first element (which will be the nearest) from the sorted array
	return numbers[ 0 ];
}

function extractFontWeights( fontFaces: any[] ): number[] {
	const result: number[] = [];

	fontFaces.forEach( ( face ) => {
		const weights = String( face.fontWeight ).split( ' ' );

		if ( weights.length === 2 ) {
			const start = parseInt( weights[ 0 ] );
			const end = parseInt( weights[ 1 ] );

			for ( let i = start; i <= end; i += 100 ) {
				result.push( i );
			}
		} else if ( weights.length === 1 ) {
			result.push( parseInt( weights[ 0 ] ) );
		}
	} );

	return result;
}

/*
 * Format the font family to use in the CSS font-family property of a CSS rule.
 *
 * The input can be a string with the font family name or a string with multiple font family names separated by commas.
 * It follows the recommendations from the CSS Fonts Module Level 4.
 * https://www.w3.org/TR/css-fonts-4/#font-family-prop
 *
 * @param input - The font family.
 * @return The formatted font family.
 */
export function formatFontFamily( input: string ): string {
	// Matches strings that are not exclusively alphabetic characters or hyphens, and do not exactly follow the pattern generic(alphabetic characters or hyphens).
	const regex = /^(?!generic\([ a-zA-Z\-]+\)$)(?!^[a-zA-Z\-]+$).+/;
	const output = input.trim();

	const formatItem = ( item: string ) => {
		item = item.trim();
		if ( item.match( regex ) ) {
			// removes leading and trailing quotes.
			item = item.replace( /^["']|["']$/g, '' );
			return `"${ item }"`;
		}
		return item;
	};

	if ( output.includes( ',' ) ) {
		return output
			.split( ',' )
			.map( formatItem )
			.filter( ( item ) => item !== '' )
			.join( ', ' );
	}

	return formatItem( output );
}

/**
 * Gets the preview style for a font family.
 *
 * @param family The font family object
 * @return CSS style object for the font family
 */
export function getFamilyPreviewStyle( family: any ): React.CSSProperties {
	const style: React.CSSProperties = {
		fontFamily: formatFontFamily( family.fontFamily ),
	};

	if ( ! Array.isArray( family.fontFace ) ) {
		style.fontWeight = '400';
		style.fontStyle = 'normal';
		return style;
	}

	if ( family.fontFace ) {
		//get all the font faces with normal style
		const normalFaces = family.fontFace.filter(
			( face: any ) =>
				face?.fontStyle && face.fontStyle.toLowerCase() === 'normal'
		);
		if ( normalFaces.length > 0 ) {
			style.fontStyle = 'normal';
			const normalWeights = extractFontWeights( normalFaces );
			const nearestWeight = findNearest( 400, normalWeights );
			style.fontWeight = String( nearestWeight ) || '400';
		} else {
			style.fontStyle =
				( family.fontFace.length && family.fontFace[ 0 ].fontStyle ) ||
				'normal';
			style.fontWeight =
				( family.fontFace.length &&
					String( family.fontFace[ 0 ].fontWeight ) ) ||
				'400';
		}
	}

	return style;
}

/**
 * Iterates through the presets array and searches for slugs that start with the specified
 * slugPrefix followed by a numerical suffix. It identifies the highest numerical suffix found
 * and returns one greater than the highest found suffix, ensuring that the new index is unique.
 *
 * @param presets    The array of preset objects, each potentially containing a slug property.
 * @param slugPrefix The prefix to look for in the preset slugs.
 *
 * @return The next available index for a preset with the specified slug prefix, or 1 if no matching slugs are found.
 */
/**
 * Gets the variation class name for a block style variation.
 *
 * @param variation The variation name.
 * @return The variation class name.
 */
export function getVariationClassName( variation: string ): string {
	if ( ! variation ) {
		return '';
	}
	return `is-style-${ variation }`;
}

export function getNewIndexFromPresets(
	presets: any[],
	slugPrefix: string
): number {
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
