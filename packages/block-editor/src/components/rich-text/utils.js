/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

export function addActiveFormats( value, activeFormats ) {
	if ( ! activeFormats?.length ) {
		return;
	}

	// Migrate writes from the deprecated `formats` sparse array to the
	// canonical `_formats` Map. Prepend each active format as a range
	// covering the whole value so it appears outermost at every position.
	if ( value._formats instanceof Map ) {
		const length = value.text.length;
		const merged = new Map();
		for ( const format of activeFormats ) {
			merged.set( format, [ 0, length ] );
		}
		for ( const [ format, range ] of value._formats ) {
			merged.set( format, range );
		}
		value._formats = merged;
		return;
	}

	let index = value.formats.length;
	while ( index-- ) {
		value.formats[ index ] = [
			...activeFormats,
			...( value.formats[ index ] || [] ),
		];
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
