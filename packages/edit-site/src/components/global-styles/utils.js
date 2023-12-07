/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';

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
 * Makes a copy of an object without storing any references to the original object.
 * @param {Object} object
 * @return {Object} The cloned object.
 */
function cloneDeep( object ) {
	return ! object ? {} : JSON.parse( JSON.stringify( object ) );
}

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
		return filterObjectByProperty( variation, property );
	} );

	return variationsWithOnlyProperty.map( ( variation ) =>
		mergeBaseAndUserConfigs( userSettingsWithoutProperty, variation )
	);
};
