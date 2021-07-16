/**
 * Removes any HTML tags from the provided string.
 *
 * @param {string} html The string containing html.
 *
 * @return {string} The text content with any html removed.
 */
export default function stripHTML( html ) {
	const document = new window.DOMParser().parseFromString(
		html,
		'text/html'
	);
	return document.body.textContent || '';
}
