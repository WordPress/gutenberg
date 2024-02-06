/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import cloneDeep from '../../utils/clone-deep';
import { mergeBaseAndUserConfigs } from './global-styles-provider';
/**
 * Returns a new object with only the properties specified in `properties`.
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
 * Removes all instances of a property from an object.
 *
 * @param {Object} object
 * @param {string} property
 * @return {Object} The modified object.
 */
const removePropertyFromObject = ( object, property ) => {
	for ( const key in object ) {
		if ( key === property ) {
			delete object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			removePropertyFromObject( object[ key ], property );
		}
	}
	return object;
};

/**
 * Return style variations with all properties removed except for the one specified in `type`.
 *
 * @param {Object} user       The user variation.
 * @param {Array}  variations The other style variations.
 * @param {string} property   The property to filter by.
 *
 * @return {Array} The style variation with only the specified property filtered.
 */
export const getVariationsByProperty = ( user, variations, property ) => {
	const userSettingsWithoutProperty = removePropertyFromObject(
		cloneDeep( user ),
		property
	);

	const variationsWithOnlyProperty = variations.map( ( variation ) => {
		return {
			...filterObjectByProperty( variation, property ),
			// Add variation title and description to every variation item.
			title: variation?.title,
			description: variation?.description,
		};
	} );

	return variationsWithOnlyProperty.map( ( variation ) =>
		mergeBaseAndUserConfigs( userSettingsWithoutProperty, variation )
	);
};

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

export default function useThemeStyleVariationsByProperty( { styleProperty } ) {
	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );
	const { user } = useContext( GlobalStylesContext );

	return useMemo( () => {
		if ( ! styleProperty || ! variations.length ) {
			return [];
		}
		/*
		   @TODO:
			For colors, should also get filter?
			Memoize/cache all this better?
			Test with empty theme
			Test with 2022 - typography font families bork for some reason

		 */
		const styleVariations = getVariationsByProperty(
			user,
			variations,
			styleProperty
		);

		return styleVariations.length ? styleVariations : [];
	}, [ styleProperty, variations ] );
}
