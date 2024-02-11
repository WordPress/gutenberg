/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { children as childrenSource } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import RichText from './';

/**
 * Internal dependencies
 */
import { getMultilineTag } from './utils';

export function Content( {
	value,
	tagName: Tag,
	multiline,
	format,
	...props
} ) {
	if ( RichText.isEmpty( value ) ) {
		const MultilineTag = getMultilineTag( multiline );
		value = MultilineTag ? <MultilineTag /> : null;
	} else if ( Array.isArray( value ) ) {
		deprecated( 'wp.blockEditor.RichText value prop as children type', {
			since: '6.1',
			version: '6.3',
			alternative: 'value prop as string',
			link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
		} );
		value = <RawHTML>{ childrenSource.toHTML( value ) }</RawHTML>;
	} else if ( typeof value === 'string' ) {
		// To do: deprecate.
		value = <RawHTML>{ value }</RawHTML>;
	} else {
		// To do: create a toReactComponent method on RichTextData, which we
		// might in the future also use for the editable tree. See
		// https://github.com/WordPress/gutenberg/pull/41655.
		value = <RawHTML>{ value.toHTMLString() }</RawHTML>;
	}

	return Tag ? <Tag { ...props }>{ value }</Tag> : value;
}
