/**
 * Parse the given HTML into a body element.
 *
 * @param {HTMLDocument} document The HTML document to use to parse.
 * @param {string}       html     The HTML to parse.
 *
 * @return {HTMLBodyElement} Body element with parsed HTML.
 */
export function createElement( { implementation }, html ) {
	const { body } = implementation.createHTMLDocument( '' );
	body.innerHTML = html;
	return body;
}
