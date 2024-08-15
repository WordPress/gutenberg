/** @type {HTMLTextAreaElement} */
let _decodeTextArea;

/**
 * Decodes the HTML entities from a given string.
 *
 * @param {string} html String that contain HTML entities.
 *
 * @example
 * ```js
 * import { decodeEntities } from '@wordpress/html-entities';
 *
 * const result = decodeEntities( '&aacute;' );
 * console.log( result ); // result will be "á"
 * ```
 *
 * @return {string} The decoded string.
 */
export function decodeEntities( html ) {
	// Not a string, or no entities to decode.
	if ( 'string' !== typeof html || -1 === html.indexOf( '&' ) ) {
		return html;
	}

	// Create a textarea for decoding entities, that we can reuse.
	if ( undefined === _decodeTextArea ) {
		if (
			document.implementation &&
			document.implementation.createHTMLDocument
		) {
			_decodeTextArea = document.implementation
				.createHTMLDocument( '' )
				.createElement( 'textarea' );
		} else {
			_decodeTextArea = document.createElement( 'textarea' );
		}
	}

	_decodeTextArea.innerHTML = html;
	const decoded = _decodeTextArea.textContent;
	_decodeTextArea.innerHTML = '';

	/**
	 * Cast to string, HTMLTextAreaElement should always have `string` textContent.
	 *
	 * > The `textContent` property of the `Node` interface represents the text content of the
	 * > node and its descendants.
	 * >
	 * > Value: A string or `null`
	 * >
	 * > * If the node is a `document` or a Doctype, `textContent` returns `null`.
	 * > * If the node is a CDATA section, comment, processing instruction, or text node,
	 * >   textContent returns the text inside the node, i.e., the `Node.nodeValue`.
	 * > * For other node types, `textContent returns the concatenation of the textContent of
	 * >   every child node, excluding comments and processing instructions. (This is an empty
	 * >   string if the node has no children.)
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
	 */
	return /** @type {string} */ ( decoded );
}
