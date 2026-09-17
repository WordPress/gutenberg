import remove from './remove';

const DANGEROUS_TAGS = new Set( [ 'SCRIPT', 'OBJECT', 'EMBED' ] );
const DANGEROUS_URI_ATTRS = new Set( [
	'href',
	'src',
	'action',
	'formaction',
	'xlink:href',
	'data',
] );
const DANGEROUS_URI_PATTERN =
	/^[\s\x00-\x20]*(?:javascript:|vbscript:|data:\s*(?:text\/html|image\/svg\+xml)(?:[;,]|$))/i;

/**
 * Strips scripts, embedding elements, on* attributes, and executable URIs from HTML.
 *
 * @param {string} html HTML to sanitize.
 *
 * @return {string} The sanitized HTML.
 */
export default function safeHTML( html ) {
	const { body } = document.implementation.createHTMLDocument( '' );
	body.innerHTML = html;
	const elements = body.getElementsByTagName( '*' );
	let elementIndex = elements.length;

	while ( elementIndex-- ) {
		const element = elements[ elementIndex ];

		if ( DANGEROUS_TAGS.has( element.tagName ) ) {
			remove( element );
		} else {
			let attributeIndex = element.attributes.length;

			while ( attributeIndex-- ) {
				const { name: key, value } =
					element.attributes[ attributeIndex ];
				const lowerKey = key.toLowerCase();

				if ( lowerKey.startsWith( 'on' ) ) {
					element.removeAttribute( key );
				} else if (
					DANGEROUS_URI_ATTRS.has( lowerKey ) &&
					DANGEROUS_URI_PATTERN.test( value )
				) {
					element.removeAttribute( key );
				}
			}
		}
	}

	return body.innerHTML;
}
