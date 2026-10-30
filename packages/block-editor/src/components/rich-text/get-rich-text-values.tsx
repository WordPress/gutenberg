import { RawHTML, StrictMode, Fragment } from '@wordpress/element';
import {
	getSaveElement,
	__unstableGetBlockProps as getBlockProps,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import type { ComponentType, ReactNode } from 'react';
import type { Block } from '@wordpress/blocks';
import InnerBlocks from '../inner-blocks';
import { Content } from './content';

type Values = unknown[];
// The untyped `InnerBlocks` has a `Content` static.
type InnerBlocksWithContent = { Content: ComponentType };
type SkippableFilters = typeof getBlockProps & { skipFilters?: boolean };

/*
 * This function is similar to `@wordpress/element`'s `renderToString` function,
 * except that it does not render the elements to a string, but instead collects
 * the values of all rich text `Content` elements.
 */
function addValuesForElement(
	element: ReactNode,
	values: Values,
	innerBlocks: Block[]
): void {
	if ( null === element || undefined === element || false === element ) {
		return;
	}

	if ( Array.isArray( element ) ) {
		return addValuesForElements( element, values, innerBlocks );
	}

	switch ( typeof element ) {
		case 'string':
		case 'number':
			return;
	}

	// Not empty, an array, a string or a number, so an element.
	const { type, props } = element as {
		type: unknown;
		props: { children?: ReactNode; value?: unknown };
	};

	switch ( type ) {
		case StrictMode:
		case Fragment:
			return addValuesForElements( props.children, values, innerBlocks );
		case RawHTML:
			return;
		case ( InnerBlocks as unknown as InnerBlocksWithContent ).Content:
			return addValuesForBlocks( values, innerBlocks );
		case Content:
			values.push( props.value );
			return;
	}

	switch ( typeof type ) {
		case 'string':
			if ( typeof props.children !== 'undefined' ) {
				return addValuesForElements(
					props.children,
					values,
					innerBlocks
				);
			}
			return;
		case 'function':
			// Either a class or a function component.
			const el =
				type.prototype && typeof type.prototype.render === 'function'
					? new (
							type as new ( p: object ) => {
								render: () => ReactNode;
							}
						 )( props ).render()
					: ( type as ( p: object ) => ReactNode )( props );
			return addValuesForElement( el, values, innerBlocks );
	}
}

function addValuesForElements(
	children: ReactNode,
	...args: [ Values, Block[] ]
): void {
	const list: ReactNode[] = Array.isArray( children )
		? children
		: [ children ];

	for ( let i = 0; i < list.length; i++ ) {
		addValuesForElement( list[ i ], ...args );
	}
}

function addValuesForBlocks( values: Values, blocks: Block[] ) {
	for ( let i = 0; i < blocks.length; i++ ) {
		const { name, attributes, innerBlocks } = blocks[ i ];
		const InnerBlocksContent = (
			InnerBlocks as unknown as InnerBlocksWithContent
		 ).Content;
		const saveElement = getSaveElement(
			name,
			attributes,
			// Instead of letting save elements use `useInnerBlocksProps.save`,
			// force them to use InnerBlocks.Content instead so we can intercept
			// a single component.
			<InnerBlocksContent />
		);
		// Save functions return elements.
		addValuesForElement( saveElement as ReactNode, values, innerBlocks );
	}
}

export function getRichTextValues( blocks: Block[] = [] ) {
	// The serializer reads the flag off the function.
	( getBlockProps as SkippableFilters ).skipFilters = true;
	const values: Values = [];
	addValuesForBlocks( values, blocks );
	( getBlockProps as SkippableFilters ).skipFilters = false;
	return values.map( ( value ) =>
		value instanceof RichTextData
			? value
			: // Other values are HTML strings.
				RichTextData.fromHTMLString( value as string )
	);
}
