/**
 * External dependencies
 */
import type { ReactNode, ReactElement, ReactPortal } from 'react';

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
export function getValidChildren(
	children: ReactNode
): Array<
	ReactElement | number | string | Iterable< ReactNode > | ReactPortal
> {
	if ( typeof children === 'string' ) {
		return [ children ];
	}

	return Children.toArray( children ).filter( ( child ) =>
		isValidElement( child )
	);
}
