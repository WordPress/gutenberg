/**
 * WordPress dependencies
 */
import { getFilesFromDataTransfer } from '@wordpress/dom';

/**
 * Normalizes a given string of HTML to remove the Windows-specific "Fragment"
 * comments and any preceding and trailing content.
 *
 * @param {string} html the html to be normalized
 * @return {string} the normalized html
 */
function removeWindowsFragments( html ) {
	const startStr = '<!--StartFragment-->';
	const startIdx = html.indexOf( startStr );
	if ( startIdx > -1 ) {
		html = html.substring( startIdx + startStr.length );
	} else {
		// No point looking for EndFragment
		return html;
	}

	const endStr = '<!--EndFragment-->';
	const endIdx = html.indexOf( endStr );
	if ( endIdx > -1 ) {
		html = html.substring( 0, endIdx );
	}

	return html;
}

/**
 * Removes the charset meta tag inserted by Chromium.
 * See:
 * - https://github.com/WordPress/gutenberg/issues/33585
 * - https://bugs.chromium.org/p/chromium/issues/detail?id=1264616#c4
 *
 * @param {string} html the html to be stripped of the meta tag.
 * @return {string} the cleaned html
 */
function removeCharsetMetaTag( html ) {
	const metaTag = `<meta charset='utf-8'>`;

	if ( html.startsWith( metaTag ) ) {
		return html.slice( metaTag.length );
	}

	return html;
}

export function getPasteEventData( { clipboardData } ) {
	let plainText = '';
	let html = '';

	try {
		plainText = clipboardData.getData( 'text/plain' );
		html = clipboardData.getData( 'text/html' );
	} catch ( error ) {
		// Some browsers like UC Browser paste plain text by default and
		// don't support clipboardData at all, so allow default
		// behaviour.
		return;
	}

	// Remove Windows-specific metadata appended within copied HTML text.
	html = removeWindowsFragments( html );

	// Strip meta tag.
	html = removeCharsetMetaTag( html );

	const files = getFilesFromDataTransfer( clipboardData );

	if ( files.length && ! shouldDismissPastedFiles( files, html ) ) {
		return { files };
	}

	return { html, plainText, files: [] };
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
		if ( html.match( IMAGE_TAG )?.length !== 1 ) {
			return true;
		}

		// Even when there is exactly one <img> tag in the HTML payload, we
		// choose to weed out local images, i.e. those whose source starts with
		// "file://". These payloads occur in specific configurations, such as
		// when copying an entire document from Microsoft Word, that contains
		// text and exactly one image, and pasting that content using Google
		// Chrome.
		const IMG_WITH_LOCAL_SRC = /<\s*img\b[^>]*\bsrc="file:\/\//i;
		if ( html.match( IMG_WITH_LOCAL_SRC ) ) {
			return true;
		}
	}

	return false;
}
