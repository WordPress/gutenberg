import { RichTextData, create } from '@wordpress/rich-text';

export function addActiveFormats( value, activeFormats ) {
	if ( activeFormats?.length ) {
		let index = value.formats.length;

		while ( index-- ) {
			value.formats[ index ] = [
				...activeFormats,
				...( value.formats[ index ] || [] ),
			];
		}
	}
}

/**
 * Get the multiline tag based on the multiline prop.
 *
 * @param {?(string|boolean)} multiline The multiline prop.
 *
 * @return {string | undefined} The multiline tag.
 */
export function getMultilineTag( multiline ) {
	if ( multiline !== true && multiline !== 'p' && multiline !== 'li' ) {
		return;
	}

	return multiline === true ? 'p' : multiline;
}

export function isEmpty( value ) {
	return ! value || value.length === 0;
}

export function getAllowedFormats( { allowedFormats, disableFormats } ) {
	if ( disableFormats ) {
		return getAllowedFormats.EMPTY_ARRAY;
	}

	return allowedFormats;
}

getAllowedFormats.EMPTY_ARRAY = [];

/**
 * The formats, replacements and text of a rich text attribute value, which is
 * rich text data or an HTML string. Spreading rich text data would lose them:
 * they are getters.
 *
 * @param {unknown} value Attribute value.
 *
 * @return {import('@wordpress/rich-text').RichTextValue} Rich text value
 *                                                       without a selection.
 */
export function toRecord( value ) {
	if ( value instanceof RichTextData ) {
		const { formats, replacements, text } = value;
		return { formats, replacements, text };
	}
	return create( { html: value ? String( value ) : '' } );
}
