/**
 * WordPress dependencies
 */
import { RawHTML, StrictMode, Fragment } from '@wordpress/element';
import {
	getSaveElement,
	__unstableGetBlockProps as getBlockProps,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InnerBlocks from '../inner-blocks';
import { Content } from './content';

const elementToInnerBlocksMap = new WeakMap();

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

	if ( elementToInnerBlocksMap.has( element ) ) {
		innerBlocks = elementToInnerBlocksMap.get( element ).innerBlocks;
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

function _getSaveElement( name, attributes, innerBlocks ) {
	return getSaveElement(
		name,
		attributes,
		innerBlocks.map( ( block ) => {
			const saveElement = _getSaveElement(
				block.name,
				block.attributes,
				block.innerBlocks
			);
			elementToInnerBlocksMap.set( saveElement, block );
			return saveElement;
		} )
	);
}

function addValuesForBlocks( values, blocks ) {
	for ( let i = 0; i < blocks.length; i++ ) {
		const { name, attributes, innerBlocks } = blocks[ i ];
		const saveElement = _getSaveElement( name, attributes, innerBlocks );
		addValuesForElement( saveElement, values, innerBlocks );
	}
}

export function getRichTextValues( blocks = [] ) {
	getBlockProps.skipFilters = true;
	const values = [];
	addValuesForBlocks( values, blocks );
	getBlockProps.skipFilters = false;
	return values;
}
