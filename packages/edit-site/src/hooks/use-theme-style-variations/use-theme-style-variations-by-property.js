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
import cloneDeep from '../../utils/clone-deep';
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

/**
 * Removes all instances of properties from an object.
 *
 * @param {Object} object     The object to remove the properties from.
 * @param {string} properties The properties to remove.
 * @return {Object} The modified object.
 */
export function removePropertiesFromObject( object, properties ) {
	if ( ! properties || typeof properties !== 'object' ) {
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
 * Fetches the current theme style variations that contain only the specified properties
 * and merges them with the user config.
 *
 * @param {Object} props            Object of hook args.
 * @param {string} props.properties The properties to filter by.
 * @return {Object[]|*} The merged object.
 */
export function useCurrentMergeThemeStyleVariationsWithUserConfig( {
	properties,
} ) {
	const { variationsFromTheme } = useSelect( ( select ) => {
		const _variationsFromTheme =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations();

		return {
			variationsFromTheme: _variationsFromTheme || [],
		};
	}, [] );
	const { user: userVariation } = useContext( GlobalStylesContext );

	return useMemo( () => {
		const clonedUserVariation = cloneDeep( userVariation );

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

		return [
			userVariationWithoutProperties,
			...variationsWithPropertiesAndBase,
		];
	}, [ properties, userVariation, variationsFromTheme ] );
}

/**
 * Returns a new object, with properties specified in `properties` array.,
 * maintain the original object tree structure.
 * The function is recursive, so it will perform a deep search for the given properties.
 * E.g., the function will return `{ a: { b: { c: { test: 1 } } } }` if the properties are  `[ 'test' ]`.
 *
 * @param {Object} object     The object to filter
 * @param {Array}  properties The properties to filter by
 * @return {Object} The merged object.
 */
export const filterObjectByProperties = ( object, properties ) => {
	if ( ! object ) {
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
 * @param {Object} variation  The variation to compare.
 * @param {string} properties The properties to compare.
 * @return {boolean} Whether the variation contains only the specified properties.
 */
export function isVariationWithProperties( variation, properties ) {
	const variationWithProperties = filterObjectByProperties(
		cloneDeep( variation ),
		properties
	);

	return (
		JSON.stringify( variationWithProperties?.styles ) ===
			JSON.stringify( variation?.styles ) &&
		JSON.stringify( variationWithProperties?.settings ) ===
			JSON.stringify( variation?.settings )
	);
}
