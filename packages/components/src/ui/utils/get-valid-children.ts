/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Children, isValidElement } from '@wordpress/element';
import type React from 'react';

/**
 * Gets a collection of available children elements from a React component's children prop.
 *
 * @param  children
 *
 * @return An array of available children.
 */
export function getValidChildren(
	children: ReactNode
): Array< React.ReactChild | React.ReactFragment | React.ReactPortal > {
	if ( typeof children === 'string' ) return [ children ];

	return Children.toArray( children ).filter( ( child ) =>
		isValidElement( child )
	);
}
