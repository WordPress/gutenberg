import safeHTML from './safe-html';

/**
 * Removes any HTML tags from the provided string.
 *
 * @param html The string containing html.
 *
 * @return The text content with any html removed.
 */
export default function stripHTML( html: string ): string {
	// Remove any script tags or on* attributes otherwise their *contents* will be left
	// in place following removal of HTML tags.
	html = safeHTML( html );

	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;
	return doc.body.textContent || '';
}
