/**
 * WordPress dependencies
 */
import { RawHTML, StrictMode, Fragment } from '@wordpress/element';
import {
	children as childrenSource,
	getSaveElement,
	__unstableGetBlockProps as getBlockProps,
} from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getMultilineTag } from './utils';
import InnerBlocks from '../inner-blocks';

export const Content = ( { value, tagName: Tag, multiline, ...props } ) => {
	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		deprecated( 'wp.blockEditor.RichText value prop as children type', {
			since: '6.1',
			version: '6.3',
			alternative: 'value prop as string',
			link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
		} );

		value = childrenSource.toHTML( value );
	}

	const MultilineTag = getMultilineTag( multiline );

	if ( ! value && MultilineTag ) {
		value = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	const content = <RawHTML>{ value }</RawHTML>;

	if ( Tag ) {
		const { format, ...restProps } = props;
		return <Tag { ...restProps }>{ content }</Tag>;
	}

	return content;
};

function addValuesForElements( children, ...args ) {
	children = Array.isArray( children ) ? children : [ children ];

	for ( let i = 0; i < children.length; i++ ) {
		addValuesForElement( children[ i ], ...args );
	}
}

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

function addValuesForBlocks( values, blocks ) {
	for ( let i = 0; i < blocks.length; i++ ) {
		const { name, attributes, innerBlocks } = blocks[ i ];
		const saveElement = getSaveElement( name, attributes );
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
