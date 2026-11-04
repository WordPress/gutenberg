import { RawHTML } from '@wordpress/element';
import { children as childrenSource } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';
import type { RichTextData } from '@wordpress/rich-text';
import { getMultilineTag, isEmpty } from './utils';
import type { RichTextContentProps, RichTextFieldValue } from './types';

export function valueToHTMLString(
	value: RichTextFieldValue | null | undefined,
	multiline?: string | boolean | null
): string {
	if ( isEmpty( value ) ) {
		const multilineTag = getMultilineTag( multiline );
		return multilineTag ? `<${ multilineTag }></${ multilineTag }>` : '';
	}

	if ( Array.isArray( value ) ) {
		deprecated( 'wp.blockEditor.RichText value prop as children type', {
			since: '6.1',
			version: '6.3',
			alternative: 'value prop as string',
			link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
		} );
		return childrenSource.toHTML( value );
	}

	// To do: deprecate string type.
	if ( typeof value === 'string' ) {
		return value;
	}

	// To do: create a toReactComponent method on RichTextData, which we
	// might in the future also use for the editable tree. See
	// https://github.com/WordPress/gutenberg/pull/41655.
	// Neither empty, an array nor a string, so rich text data.
	return ( value as RichTextData ).toHTMLString();
}

export function Content( {
	value,
	tagName: Tag,
	multiline,
	format,
	...props
}: RichTextContentProps ) {
	const content = (
		<RawHTML>{ valueToHTMLString( value, multiline ) }</RawHTML>
	);
	return Tag ? <Tag { ...props }>{ content }</Tag> : content;
}
