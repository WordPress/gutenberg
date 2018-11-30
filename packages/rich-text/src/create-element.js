/**
 * Parse the given HTML into a body element.
 *
 * Note: The current implementation will return a shared reference, reset on
 * each call to `createElement`. Therefore, you should not hold a reference to
 * the value to operate upon asynchronously, as it may have unexpected results.
 *
 * @param {HTMLDocument} document The HTML document to use to parse.
 * @param {string}       html     The HTML to parse.
 *
 * @return {HTMLBodyElement} Body element with parsed HTML.
 */
export function createElement( { implementation }, html ) {
	if ( ! createElement.body ) {
		createElement.body = implementation.createHTMLDocument( '' ).body;
	}

	createElement.body.innerHTML = html;

	return createElement.body;
}
