/**
 * Removes any HTML tags from the provided string.
 *
 * @param {string} html The string containing html.
 *
 * @return {string} The text content with any html removed.
 */
export default function stripHTML( html ) {
	// DOM Parser will ignore any space character coming after
	// the DocType.
	// see: https://html.spec.whatwg.org/multipage/parsing.html#after-doctype-name-state
	// As a result any leading space in the provided `html`
	// argument string will be stripped out.
	// Manually retrieve these prior to parsing for restoration post-parse.
	// @ts-ignore
	const [ spacesToRestore ] = html.match( /^\s*/ );

	const document = new window.DOMParser().parseFromString(
		html,
		'text/html'
	);

	const content = document.body.textContent || '';

	return spacesToRestore + content;
}
