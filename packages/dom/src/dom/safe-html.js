/**
 * Internal dependencies
 */
import remove from './remove';

/**
 * Strips scripts and on* attributes from HTML.
 *
 * @param {string} html HTML to sanitize.
 *
 * @return {string} The sanitized HTML.
 */
export default function safeHTML( html ) {
	const { body } = document.implementation.createHTMLDocument( '' );
	body.innerHTML = html;
	const elements = body.getElementsByTagName( '*' );

	// @ts-ignore
	for ( const element of elements ) {
		if ( element.tagName === 'SCRIPT' ) {
			remove( element );
		} else {
			let index = element.attributes.length;

			while ( index-- ) {
				const { name: key } = element.attributes[ index ];

				if ( key.startsWith( 'on' ) ) {
					element.removeAttribute( key );
				}
			}
		}
	}

	return body.innerHTML;
}
