import {
	areGlobalStylesEqual,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import type {
	GlobalStylesConfig,
	GlobalStylesSettings,
} from '@wordpress/global-styles-engine';
import { __ } from '@wordpress/i18n';
import { unlock } from './lock-unlock';

const { getViewportBreakpoints } = unlock( globalStylesEnginePrivateApis );

/**
 * State definition with value and label.
 */
export interface StateDefinition {
	value: string;
	label: string;
}

/**
 * Valid states for elements with their labels.
 * This mirrors the PHP constant in lib/class-wp-theme-json-gutenberg.php
 */
export const VALID_ELEMENT_STATES: Record< string, StateDefinition[] > = {
	link: [
		{ value: ':link', label: __( 'Link' ) },
		{ value: ':any-link', label: __( 'Any Link' ) },
		{ value: ':visited', label: __( 'Visited' ) },
		{ value: ':hover', label: __( 'Hover' ) },
		{ value: ':focus', label: __( 'Focus' ) },
		{ value: ':focus-visible', label: __( 'Focus-visible' ) },
		{ value: ':active', label: __( 'Active' ) },
	],
	button: [
		{ value: ':link', label: __( 'Link' ) },
		{ value: ':any-link', label: __( 'Any Link' ) },
		{ value: ':visited', label: __( 'Visited' ) },
		{ value: ':hover', label: __( 'Hover' ) },
		{ value: ':focus', label: __( 'Focus' ) },
		{ value: ':focus-visible', label: __( 'Focus-visible' ) },
		{ value: ':active', label: __( 'Active' ) },
	],
};

/**
 * Valid states for blocks with their labels.
 * This mirrors the PHP constant in lib/class-wp-theme-json-gutenberg.php
 */
export const VALID_BLOCK_STATES: Record< string, StateDefinition[] > = {
	'core/button': [
		{ value: ':hover', label: __( 'Hover' ) },
		{ value: ':focus', label: __( 'Focus' ) },
		{ value: ':focus-visible', label: __( 'Focus-visible' ) },
		{ value: ':active', label: __( 'Active' ) },
	],
};

/**
 * Responsive breakpoint states available for all blocks.
 * These map to CSS media queries wrapping the block's styles.
 */
export const RESPONSIVE_STATES: StateDefinition[] = [
	{ value: '@tablet', label: __( 'Tablet' ) },
	{ value: '@mobile', label: __( 'Mobile' ) },
];

/**
 * Get the valid pseudo states for a given block or element.
 *
 * @param name The block name (e.g., 'core/button') or element name (e.g., 'button')
 * @return Array of valid pseudo state definitions, or empty array if none
 */
export function getValidPseudoStates( name: string ): StateDefinition[] {
	// Check if it's a block (contains a slash, e.g. 'core/button').
	if ( VALID_BLOCK_STATES[ name ] ) {
		return VALID_BLOCK_STATES[ name ] ?? [];
	}

	// Check if it's an element
	if ( VALID_ELEMENT_STATES[ name ] ) {
		return VALID_ELEMENT_STATES[ name ];
	}

	return [];
}

/**
 * Get the valid viewport state definitions.
 *
 * @param viewportSettings
 * @return Array of valid viewport state definitions.
 */
export function getValidViewportStates(
	viewportSettings?: GlobalStylesSettings[ 'viewport' ]
): StateDefinition[] {
	const breakpoints = getViewportBreakpoints( viewportSettings );

	return RESPONSIVE_STATES.filter(
		( state ) =>
			( state.value !== '@tablet' || breakpoints.tablet !== undefined ) &&
			( state.value !== '@mobile' || breakpoints.mobile !== undefined )
	);
}

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
