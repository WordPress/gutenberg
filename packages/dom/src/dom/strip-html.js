/**
 * Internal dependencies
 */
import safeHTML from './safe-html';

/**
 * Removes any HTML tags from the provided string.
 *
 * @param {string} html The string containing html.
 *
 * @return {string} The text content with any html removed.
 */
export default function stripHTML( html ) {
	// Remove any script tags or on* attributes otherwise their *contents* will be left
	// in place following removal of HTML tags.
	html = safeHTML( html );

	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;
	return doc.body.textContent || '';
}
