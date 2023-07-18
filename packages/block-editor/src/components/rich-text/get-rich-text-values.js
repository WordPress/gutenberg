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

/*
 * This function is similar to `@wordpress/element`'s `renderToString` function,
 * except that it does not render the elements to a string, but instead collects
 * the values of all rich text `Content` elements.
 */
function addValuesForElement( element, ...args ) {
	if ( null === element || undefined === element || false === element ) {
		return;
	}

	if ( Array.isArray( element ) ) {
		return addValuesForElements( element, ...args );
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
			return addValuesForElements( props.children, ...args );
		case RawHTML:
			return;
		case InnerBlocks.Content:
			return addValuesForBlocks( ...args );
		case Content:
			const [ values ] = args;
			values.push( props.value );
			return;
	}

	switch ( typeof type ) {
		case 'string':
			if ( typeof props.children !== 'undefined' ) {
				return addValuesForElements( props.children, ...args );
			}
			return;
		case 'function':
			if (
				type.prototype &&
				typeof type.prototype.render === 'function'
			) {
				return addValuesForElement(
					new type( props ).render(),
					...args
				);
			}

			return addValuesForElement( type( props ), ...args );
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
		innerBlocks.map( ( block ) =>
			_getSaveElement( block.name, block.attributes, block.innerBlocks )
		)
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
