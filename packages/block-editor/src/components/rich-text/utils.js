import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { isFormatEqual } from '@wordpress/rich-text';

export function addActiveFormats( value, activeFormats ) {
	if ( activeFormats?.length ) {
		let index = value.formats.length;

		while ( index-- ) {
			const existingFormats = value.formats[ index ] || [];

			// Filter out active formats that already exist in the value's formats
			// to prevent redundant nesting (e.g., nested identical <mark> elements).
			// This is the root cause fix for: https://github.com/WordPress/gutenberg/issues/58806
			const formatsToAdd = activeFormats.filter(
				( activeFormat ) =>
					! existingFormats.some( ( existingFormat ) =>
						isFormatEqual( activeFormat, existingFormat )
					)
			);

			value.formats[ index ] = [
				...formatsToAdd,
				...existingFormats,
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

export function getAllowedFormats( { allowedFormats, disableFormats } ) {
	if ( disableFormats ) {
		return getAllowedFormats.EMPTY_ARRAY;
	}

	return allowedFormats;
}

getAllowedFormats.EMPTY_ARRAY = [];

/**
 * Creates a link from pasted URL.
 * Creates a paragraph block containing a link to the URL, and calls `onReplace`.
 *
 * @param {string}   url       The URL that could not be embedded.
 * @param {Function} onReplace Function to call with the created fallback block.
 */
export function createLinkInParagraph( url, onReplace ) {
	const link = <a href={ url }>{ url }</a>;
	onReplace(
		createBlock( 'core/paragraph', { content: renderToString( link ) } )
	);
}
