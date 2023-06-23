/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
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

function findContent( blocks, richTextValues = [] ) {
	if ( ! Array.isArray( blocks ) ) {
		blocks = [ blocks ];
	}

	for ( const block of blocks ) {
		if (
			block?.type?.__unstableIsRichTextContent ===
			Content.__unstableIsRichTextContent
		) {
			richTextValues.push( block.props.value );
			continue;
		}

		if ( block?.props?.children ) {
			findContent( block.props.children, richTextValues );
		}
	}

	return richTextValues;
}

function _getSaveElement( { name, attributes, innerBlocks } ) {
	return getSaveElement(
		name,
		attributes,
		innerBlocks.map( _getSaveElement )
	);
}

export function getRichTextValues( blocks = [] ) {
	getBlockProps.skipFilters = true;
	const values = findContent(
		( Array.isArray( blocks ) ? blocks : [ blocks ] ).map( _getSaveElement )
	);
	getBlockProps.skipFilters = false;
	return values;
}
