/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY = [];
const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

/**
 * Removes all instances of properties from an object.
 *
 * @param {Object}   object     The object to remove the properties from.
 * @param {string[]} properties The properties to remove.
 * @return {Object} The modified object.
 */
export function removePropertiesFromObject( object, properties ) {
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
 * Checks whether a style variation is empty.
 *
 * @param {Object} variation          A style variation object.
 * @param {string} variation.title    The title of the variation.
 * @param {Object} variation.settings The settings of the variation.
 * @param {Object} variation.styles   The styles of the variation.
 * @return {boolean} Whether the variation is empty.
 */
function hasThemeVariation( { title, settings, styles } ) {
	return (
		title === __( 'Default' ) || // Always preserve the default variation.
		Object.keys( settings ).length > 0 ||
		Object.keys( styles ).length > 0
	);
}

/**
 * Fetches the current theme style variations that contain only the specified properties
 * and merges them with the user config.
 *
 * @param {string[]} properties The properties to filter by.
 * @return {Object[]|*} The merged object.
 */
export function useCurrentMergeThemeStyleVariationsWithUserConfig(
	properties = []
) {
	const { variationsFromTheme } = useSelect( ( select ) => {
		const _variationsFromTheme =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations();

		return {
			variationsFromTheme: _variationsFromTheme || EMPTY_ARRAY,
		};
	}, [] );
	const { user: userVariation } = useContext( GlobalStylesContext );

	const propertiesAsString = properties.toString();

	return useMemo( () => {
		const clonedUserVariation = structuredClone( userVariation );

		// Get user variation and remove the settings for the given property.
		const userVariationWithoutProperties = removePropertiesFromObject(
			clonedUserVariation,
			properties
		);
		userVariationWithoutProperties.title = __( 'Default' );

		const variationsWithPropertiesAndBase = variationsFromTheme
			.filter( ( variation ) => {
				return isVariationWithProperties( variation, properties );
			} )
			.map( ( variation ) => {
				return mergeBaseAndUserConfigs(
					userVariationWithoutProperties,
					variation
				);
			} );

		const variationsByProperties = [
			userVariationWithoutProperties,
			...variationsWithPropertiesAndBase,
		];

		/*
		 * Filter out variations with no settings or styles.
		 */
		return variationsByProperties?.length
			? variationsByProperties.filter( hasThemeVariation )
			: [];
	}, [ propertiesAsString, userVariation, variationsFromTheme ] );
}

/**
 * Returns a new object, with properties specified in `properties` array.,
 * maintain the original object tree structure.
 * The function is recursive, so it will perform a deep search for the given properties.
 * E.g., the function will return `{ a: { b: { c: { test: 1 } } } }` if the properties are  `[ 'test' ]`.
 *
 * @param {Object}   object     The object to filter
 * @param {string[]} properties The properties to filter by
 * @return {Object} The merged object.
 */
export const filterObjectByProperties = ( object, properties ) => {
	if ( ! object || ! properties?.length ) {
		return {};
	}

	const newObject = {};
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
 * @param {Object}   variation  The variation to compare.
 * @param {string[]} properties The properties to compare.
 * @return {boolean} Whether the variation contains only the specified properties.
 */
export function isVariationWithProperties( variation, properties ) {
	const variationWithProperties = filterObjectByProperties(
		structuredClone( variation ),
		properties
	);

	return areGlobalStyleConfigsEqual( variationWithProperties, variation );
}
