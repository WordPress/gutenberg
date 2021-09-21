/**
 * Removes any HTML tags from the provided string.
 *
 * @todo Use `stripHTML` from `@wordpress/dom` package
 * after https://github.com/WordPress/gutenberg/issues/33424
 * is resolved.
 *
 * @param {string} html The string containing html.
 *
 * @return {string} The text content with any html removed.
 */
export function stripHTML( html ) {
	const document = new window.DOMParser().parseFromString(
		html,
		'text/html'
	);
	return document.body.textContent || '';
}
