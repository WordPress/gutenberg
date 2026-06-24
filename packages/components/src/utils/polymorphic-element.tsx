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

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
let cachedOwnerDocument: Document | undefined;
const htmlElementCache = new Map< string, HTMLElement >();
const svgElementCache = new Map< string, SVGElement >();

const knownSvgElementProps = new Set( [
	'clipPath',
	'clipRule',
	'cx',
	'cy',
	'd',
	'fill',
	'fillRule',
	'focusable',
	'height',
	'pathLength',
	'points',
	'preserveAspectRatio',
	'r',
	'rx',
	'ry',
	'stroke',
	'strokeLinecap',
	'strokeLinejoin',
	'strokeWidth',
	'transform',
	'viewBox',
	'width',
	'x',
	'x1',
	'x2',
	'xlinkHref',
	'xmlSpace',
	'y',
	'y1',
	'y2',
] );

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

function getCachedIntrinsicElements( element: string ) {
	const ownerDocument = globalThis.document;
	if ( ! ownerDocument ) {
		return;
	}

	if ( ownerDocument !== cachedOwnerDocument ) {
		cachedOwnerDocument = ownerDocument;
		htmlElementCache.clear();
		svgElementCache.clear();
	}

	let htmlElement = htmlElementCache.get( element );
	if ( ! htmlElement ) {
		htmlElement = ownerDocument.createElement( element );
		htmlElementCache.set( element, htmlElement );
	}

	let svgElement = svgElementCache.get( element );
	if ( ! svgElement ) {
		svgElement = ownerDocument.createElementNS( SVG_NAMESPACE, element );
		svgElementCache.set( element, svgElement );
	}

	return {
		htmlElement,
		svgElement,
	};
}

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

	if ( knownSvgElementProps.has( prop ) ) {
		return true;
	}

	const cachedElements = getCachedIntrinsicElements( element );
	if ( cachedElements ) {
		return (
			prop in cachedElements.htmlElement ||
			prop in cachedElements.svgElement
		);
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
