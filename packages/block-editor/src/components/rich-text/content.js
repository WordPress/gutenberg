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

Content.__unstableIsRichTextContent = {};

function renderChildren( children ) {
	const values = [];
	children = Array.isArray( children ) ? children : [ children ];

	for ( let i = 0; i < children.length; i++ ) {
		const child = children[ i ];
		const value = renderElement( child );
		if ( value ) {
			if ( Array.isArray( value ) ) {
				values.push( ...value );
			} else {
				values.push( value );
			}
		}
	}

	return values;
}

function renderComponent( Component, props ) {
	return renderElement( new Component( props ).render() );
}

function renderElement( element ) {
	if ( null === element || undefined === element || false === element ) {
		return;
	}

	if ( Array.isArray( element ) ) {
		return renderChildren( element );
	}

	switch ( typeof element ) {
		case 'string':
		case 'number':
			return;
	}

	const { type, props } = element;

	if (
		type.__unstableIsRichTextContent === Content.__unstableIsRichTextContent
	) {
		return props.value;
	}

	switch ( type ) {
		case StrictMode:
		case Fragment:
			return renderChildren( props.children );
		case RawHTML:
			return;
		case InnerBlocks.Content:
			return getValuesForBlocks( renderElement.innerBlocks );
	}

	switch ( typeof type ) {
		case 'string':
			if ( typeof props.children !== 'undefined' ) {
				return renderChildren( props.children );
			}
			return;
		case 'function':
			if (
				type.prototype &&
				typeof type.prototype.render === 'function'
			) {
				return renderComponent( type, props );
			}

			return renderElement( type( props ) );
	}
}

function getValuesForBlocks( blocks ) {
	const values = [];
	for ( let i = 0; i < blocks.length; i++ ) {
		const { name, attributes, innerBlocks } = blocks[ i ];
		const saveElement = getSaveElement( name, attributes );
		renderElement.innerBlocks = innerBlocks;
		const value = renderElement( saveElement );
		if ( value ) {
			if ( Array.isArray( value ) ) {
				values.push( ...value );
			} else {
				values.push( value );
			}
		}
	}
	return values;
}

export function getRichTextValues( blocks = [] ) {
	getBlockProps.skipFilters = true;
	const values = getValuesForBlocks( blocks );
	getBlockProps.skipFilters = false;
	return values;
}
