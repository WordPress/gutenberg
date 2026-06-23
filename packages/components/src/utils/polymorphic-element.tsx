/**
 * External dependencies
 */
import type * as React from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

type PolymorphicElementProps< T extends React.ElementType > = Omit<
	React.ComponentPropsWithoutRef< T >,
	'as'
> & {
	as?: T;
};

type PolymorphicElementRef< T extends React.ElementType > =
	React.ComponentPropsWithRef< T >[ 'ref' ];

function UnforwardedPolymorphicElement< T extends React.ElementType = 'div' >(
	{ as, ...props }: PolymorphicElementProps< T >,
	ref: PolymorphicElementRef< T >
) {
	const Element = as || 'div';

	return <Element ref={ ref } { ...props } />;
}

/**
 * Internal utility for components that need Emotion-compatible `as` behavior
 * while rendering with plain React elements.
 */
export const PolymorphicElement = forwardRef(
	UnforwardedPolymorphicElement
) as < T extends React.ElementType = 'div' >(
	props: PolymorphicElementProps< T > & {
		ref?: PolymorphicElementRef< T >;
	}
) => React.ReactElement | null;
