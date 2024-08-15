/**
 * WordPress dependencies
 */
import { RawHTML, StrictMode, Fragment } from '@wordpress/element';
import {
	getSaveElement,
	__unstableGetBlockProps as getBlockProps,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import InnerBlocks from '../inner-blocks';
import { Content } from './content';

/*
 * This function is similar to `@wordpress/element`'s `renderToString` function,
 * except that it does not render the elements to a string, but instead collects
 * the values of all rich text `Content` elements.
 */
function addValuesForElement( element, values, innerBlocks ) {
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

	const { type, props } = element;

	switch ( type ) {
		case StrictMode:
		case Fragment:
			return addValuesForElements( props.children, values, innerBlocks );
		case RawHTML:
			return;
		case InnerBlocks.Content:
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
			const el =
				type.prototype && typeof type.prototype.render === 'function'
					? new type( props ).render()
					: type( props );
			return addValuesForElement( el, values, innerBlocks );
	}
}

function addValuesForElements( children, ...args ) {
	children = Array.isArray( children ) ? children : [ children ];

	for ( let i = 0; i < children.length; i++ ) {
		addValuesForElement( children[ i ], ...args );
	}
}

function addValuesForBlocks( values, blocks ) {
	for ( let i = 0; i < blocks.length; i++ ) {
		const { name, attributes, innerBlocks } = blocks[ i ];
		const saveElement = getSaveElement(
			name,
			attributes,
			// Instead of letting save elements use `useInnerBlocksProps.save`,
			// force them to use InnerBlocks.Content instead so we can intercept
			// a single component.
			<InnerBlocks.Content />
		);
		addValuesForElement( saveElement, values, innerBlocks );
	}
}

export function getRichTextValues( blocks = [] ) {
	getBlockProps.skipFilters = true;
	const values = [];
	addValuesForBlocks( values, blocks );
	getBlockProps.skipFilters = false;
	return values.map( ( value ) =>
		value instanceof RichTextData
			? value
			: RichTextData.fromHTMLString( value )
	);
}
