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
 * Removes all instances of a property from an object.
 *
 * @param {Object} object   The object to remove the property from.
 * @param {string} property The property to remove.
 * @return {Object} The modified object.
 */
export function removePropertyFromObject( object, property ) {
	if ( ! property || typeof property !== 'string' ) {
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
		if ( key === property ) {
			delete object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			removePropertyFromObject( object[ key ], property );
		}
	}
	return object;
}

/**
 * Fetches the current theme style variations that contain only the specified property
 * and merges them with the user config.
 *
 * @param {Object} props          Object of hook args.
 * @param {string} props.property The property to filter by.
 * @return {Object[]|*} The merged object.
 */
export function useCurrentMergeThemeStyleVariationsWithUserConfig( {
	property,
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
		const userVariationWithoutProperty = removePropertyFromObject(
			clonedUserVariation,
			property
		);
		userVariationWithoutProperty.title = __( 'Default' );

		const variationsWithSinglePropertyAndBase = variationsFromTheme
			.filter( ( variation ) => {
				return isVariationWithSingleProperty( variation, property );
			} )
			.map( ( variation ) => {
				return mergeBaseAndUserConfigs(
					userVariationWithoutProperty,
					variation
				);
			} );

		return [
			userVariationWithoutProperty,
			...variationsWithSinglePropertyAndBase,
		];
	}, [ property, userVariation, variationsFromTheme ] );
}

/**
 * Returns a new object, with properties specified in `property`,
 * maintain the original object tree structure.
 * The function is recursive, so it will perform a deep search for the given property.
 * E.g., the function will return `{ a: { b: { c: { test: 1 } } } }` if the property is `test`.
 *
 * @param {Object} object   The object to filter
 * @param {Object} property The property to filter by
 * @return {Object} The merged object.
 */
export const filterObjectByProperty = ( object, property ) => {
	if ( ! object ) {
		return {};
	}

	const newObject = {};
	Object.keys( object ).forEach( ( key ) => {
		if ( key === property ) {
			newObject[ key ] = object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			const newFilter = filterObjectByProperty( object[ key ], property );
			if ( Object.keys( newFilter ).length ) {
				newObject[ key ] = newFilter;
			}
		}
	} );
	return newObject;
};

/**
 * Compares a style variation to the same variation filtered by a single property.
 * Returns true if the variation contains only the property specified.
 *
 * @param {Object} variation The variation to compare.
 * @param {string} property  The property to compare.
 * @return {boolean} Whether the variation contains only a single property.
 */
export function isVariationWithSingleProperty( variation, property ) {
	const variationWithProperty = filterObjectByProperty(
		cloneDeep( variation ),
		property
	);

	return (
		JSON.stringify( variationWithProperty?.styles ) ===
			JSON.stringify( variation?.styles ) &&
		JSON.stringify( variationWithProperty?.settings ) ===
			JSON.stringify( variation?.settings )
	);
}
