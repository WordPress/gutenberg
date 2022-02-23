/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { getFilesFromDataTransfer } from '@wordpress/dom';

export function getPasteEventData( { clipboardData } ) {
	let plainText = '';
	let html = '';

	// IE11 only supports `Text` as an argument for `getData` and will
	// otherwise throw an invalid argument error, so we try the standard
	// arguments first, then fallback to `Text` if they fail.
	try {
		plainText = clipboardData.getData( 'text/plain' );
		html = clipboardData.getData( 'text/html' );
	} catch ( error1 ) {
		try {
			html = clipboardData.getData( 'Text' );
		} catch ( error2 ) {
			// Some browsers like UC Browser paste plain text by default and
			// don't support clipboardData at all, so allow default
			// behaviour.
			return;
		}
	}

	const files = getFilesFromDataTransfer(
		clipboardData
	).filter( ( { type } ) => /^image\/(?:jpe?g|png|gif|webp)$/.test( type ) );

	// Only process files if no HTML is present.
	// A pasted file may have the URL as plain text.
	if ( files.length && ! html ) {
		html = files
			.map( ( file ) => `<img src="${ createBlobURL( file ) }">` )
			.join( '' );
		plainText = '';
	}

	return { html, plainText };
}

/**
 * Given a collection of DataTransfer files and HTML and plain text strings,
 * determine whether the files are to be dismissed in favor of the HTML.
 *
 * Certain office-type programs, like Microsoft Word or Apple Numbers,
 * will, upon copy, generate a screenshot of the content being copied and
 * attach it to the clipboard alongside the actual rich text that the user
 * sought to copy. In those cases, we should let Gutenberg handle the rich text
 * content and not the screenshot, since this allows Gutenberg to insert
 * meaningful blocks, like paragraphs, lists or even tables.
 *
 * @param {File[]} files File objects obtained from a paste event
 * @param {string} html  HTML content obtained from a paste event
 * @return {boolean}     True if the files should be dismissed
 */
export function shouldDismissPastedFiles( files, html /*, plainText */ ) {
	// The question is only relevant when there is actual HTML content and when
	// there is exactly one image file.
	if (
		html &&
		files?.length === 1 &&
		files[ 0 ].type.indexOf( 'image/' ) === 0
	) {
		// A single <img> tag found in the HTML source suggests that the
		// content being pasted revolves around an image. Sometimes there are
		// other elements found, like <figure>, but we assume that the user's
		// intention is to paste the actual image file.
		const IMAGE_TAG = /<\s*img\b/gi;
		return html.match( IMAGE_TAG )?.length !== 1;
	}

	return false;
}
