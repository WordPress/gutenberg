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

export const Content = ( { value, tagName: Tag, multiline, ...props } ) => {
	const MultilineTag = getMultilineTag( multiline );

	if ( RichText.isEmpty( value ) ) {
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

	if ( Tag ) {
		const { format, ...restProps } = props;
		return <Tag { ...restProps }>{ value }</Tag>;
	}

	return value;
};
