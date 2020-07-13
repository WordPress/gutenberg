/**
 * WordPress dependencies
 */
import { Children, isValidElement } from '@wordpress/element';

export function getValidChildren( children ) {
	if ( typeof children === 'string' ) return [ children ];

	return Children.toArray( children ).filter( ( child ) =>
		isValidElement( child )
	);
}
