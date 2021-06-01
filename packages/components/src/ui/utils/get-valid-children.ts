/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode, ReactNodeArray } from 'react';

/**
 * WordPress dependencies
 */
import { Children, isValidElement } from '@wordpress/element';

/**
 * Gets a collection of available children elements from a React component's children prop.
 *
 * @param children
 *
 * @return An array of available children.
 */
export function getValidChildren( children: ReactNode ): ReactNodeArray {
	if ( typeof children === 'string' ) return [ children ];

	return Children.toArray( children ).filter( ( child ) =>
		isValidElement( child )
	);
}
