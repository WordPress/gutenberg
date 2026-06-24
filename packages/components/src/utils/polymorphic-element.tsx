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

const knownIntrinsicElementProps = new Set( [
	'children',
	'className',
	'dangerouslySetInnerHTML',
	'defaultChecked',
	'defaultValue',
	'htmlFor',
	'id',
	'readOnly',
	'ref',
	'role',
	'style',
	'suppressContentEditableWarning',
	'suppressHydrationWarning',
	'tabIndex',
	'title',
] );

function isValidIntrinsicElementProp( prop: string, element: string ) {
	if (
		prop.startsWith( 'data-' ) ||
		prop.startsWith( 'aria-' ) ||
		( prop.charCodeAt( 0 ) === 111 &&
			prop.charCodeAt( 1 ) === 110 &&
			prop.charCodeAt( 2 ) < 91 )
	) {
		return true;
	}

	if ( knownIntrinsicElementProps.has( prop ) ) {
		return true;
	}

	const ownerDocument = globalThis.document;
	if ( ownerDocument ) {
		return prop in ownerDocument.createElement( element );
	}

	return prop === prop.toLowerCase();
}

function filterIntrinsicElementProps(
	props: PolymorphicElementProps< React.ElementType >,
	element: string
) {
	return Object.fromEntries(
		Object.entries( props ).filter( ( [ prop ] ) =>
			isValidIntrinsicElementProp( prop, element )
		)
	);
}

function UnforwardedPolymorphicElement(
	{ as, ...props }: PolymorphicElementProps< React.ElementType >,
	ref: React.ForwardedRef< unknown >
) {
	const Element = as || 'div';
	const forwardedProps =
		typeof Element === 'string'
			? filterIntrinsicElementProps( props, Element )
			: props;

	return <Element ref={ ref } { ...forwardedProps } />;
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
