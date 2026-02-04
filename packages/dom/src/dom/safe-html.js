/**
 * Internal dependencies
 */
import remove from './remove';

/**
 * Mock the RichTextData to avoid making the `dom` package depend on `rich-text`
 *
 * @typedef {Object} RichTextData
 * @property {Function} toHTMLString Method used for duck typing
 */

/**
 * Strips scripts and on* attributes from HTML.
 *
 * @param {string|RichTextData} html HTML to sanitize.
 *
 * @return {string} The sanitized HTML.
 */
export default function safeHTML( html ) {
	const htmlString = typeof html === 'string' ? html : castToString( html );

	const { body } = document.implementation.createHTMLDocument( '' );
	body.innerHTML = htmlString;
	const elements = body.getElementsByTagName( '*' );
	let elementIndex = elements.length;

	while ( elementIndex-- ) {
		const element = elements[ elementIndex ];

		if ( element.tagName === 'SCRIPT' ) {
			remove( element );
		} else {
			let attributeIndex = element.attributes.length;

			while ( attributeIndex-- ) {
				const { name: key } = element.attributes[ attributeIndex ];

				if ( key.startsWith( 'on' ) ) {
					element.removeAttribute( key );
				}
			}
		}
	}

	return body.innerHTML;
}

/**
 * Coerce a non-string value into a string-like one. This appeases the type
 * checker while actually guarding against accidental passing of a
 * non-RichTextData value.
 *
 * @param {any} maybeRichText String-like rich text
 *
 * @return {string} TypeScript-normalized string-like value
 */
function castToString( maybeRichText ) {
	if ( typeof maybeRichText.toHTMLString === 'function' ) {
		return maybeRichText;
	}

	return '';
}
