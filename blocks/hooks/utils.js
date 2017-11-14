/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';

export function extendElement( element, newElement ) {
	let children;

	if ( Array.isArray( element ) ) {
		children = [
			...element,
			newElement,
		];
	} else {
		children = [
			cloneElement( element, { key: 'extend' } ),
			newElement,
		];
	}

	return Children.map( children, ( child, index ) => {
		if ( ! child || isString( child ) ) {
			return child;
		}

		return cloneElement( child, { key: `${ child.key }-${ index }` } );
	} );
}
