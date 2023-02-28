/**
 * Internal dependencies
 */
import { cloneElement, Children } from './core';

/**
 * Concatenate two or more React children objects.
 *
 * @param {...?Object} childrenArguments Array of children arguments (array of arrays/strings/objects) to concatenate.
 *
 * @return {Array} The concatenated value.
 */
export function concatChildren( ...childrenArguments ) {
	return childrenArguments.reduce( ( accumulator, children, i ) => {
		Children.forEach( children, ( child, j ) => {
			if ( child && 'string' !== typeof child ) {
				child = cloneElement( child, {
					key: [ i, j ].join(),
				} );
			}

			accumulator.push( child );
		} );

		return accumulator;
	}, [] );
}
