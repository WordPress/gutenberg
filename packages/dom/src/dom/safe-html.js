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
			const length = element.attributes.length;

			for ( let i = 0; i < length; i++ ) {
				const { name: key } = element.attributes[ i ];

				if ( key.startsWith( 'on' ) ) {
					element.removeAttribute( key );
				}
			}
		}
	}

	return body.innerHTML;
}
