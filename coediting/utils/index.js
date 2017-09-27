/**
 * External dependencies
 */
import { camelCase, isObject } from 'lodash';

export function camelCaseKeysDeep( input ) {
	if ( Array.isArray( input ) ) {
		return input.map( camelCaseKeysDeep );
	}

	if ( isObject( input ) ) {
		return Object.keys( input ).reduce( ( acc, key ) => {
			acc[ camelCase( key ) ] = camelCaseKeysDeep( input[ key ] );
			return acc;
		}, {} );
	}

	return input;
}
