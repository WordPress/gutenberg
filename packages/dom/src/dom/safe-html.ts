import remove from './remove';

const UNSAFE_ELEMENTS = new Set( [
	'base',
	'embed',
	'meta',
	'noscript',
	'object',
	'script',
] );
const IFRAME_SANDBOX = 'allow-scripts allow-presentation';
const MAX_PASSES = 8;

function isScriptURL( value: string ): boolean {
	// Browsers ignore control characters and whitespace in a URL's scheme.
	return /(?:^|;)(?:javascript|vbscript):/i.test(
		value.replace( /[\p{Cc}\s]/gu, '' )
	);
}

function isCrossOriginURL( src: string | null ): boolean {
	try {
		const { origin, protocol } = new URL( src ?? '', document.baseURI );
		return (
			( protocol === 'https:' || protocol === 'http:' ) &&
			origin !== window.location.origin
		);
	} catch {
		return false;
	}
}

function sanitize( html: string ): string {
	const { body } = document.implementation.createHTMLDocument( '' );
	body.innerHTML = html;
	const elements = body.getElementsByTagName( '*' );
	let elementIndex = elements.length;

	// Named form controls can shadow these on the element itself.
	const { getAttribute, getAttributeNames, removeAttribute, setAttribute } =
		Element.prototype;

	while ( elementIndex-- ) {
		const element = elements[ elementIndex ];

		if ( UNSAFE_ELEMENTS.has( element.localName ) ) {
			remove( element );
			continue;
		}

		for ( const key of getAttributeNames.call( element ) ) {
			const value = getAttribute.call( element, key ) ?? '';

			if ( key.startsWith( 'on' ) || isScriptURL( value ) ) {
				removeAttribute.call( element, key );
			}
		}

		if (
			element.localName === 'iframe' &&
			( getAttribute.call( element, 'srcdoc' ) !== null ||
				! isCrossOriginURL( getAttribute.call( element, 'src' ) ) )
		) {
			setAttribute.call( element, 'sandbox', IFRAME_SANDBOX );
		}
	}

	return body.innerHTML;
}

/**
 * Strips scripts, on* attributes, script URLs and other active content from
 * HTML, and sandboxes iframes that the same-origin policy doesn't isolate.
 *
 * @param html HTML to sanitize.
 *
 * @return The sanitized HTML.
 */
export default function safeHTML( html: string ): string {
	let output = html;

	// Parsing serialized markup can change its structure (mutation XSS), so
	// repeat until the output is stable.
	for ( let pass = 0; pass < MAX_PASSES; pass++ ) {
		const sanitized = sanitize( output );

		if ( sanitized === output ) {
			return sanitized;
		}

		output = sanitized;
	}

	return '';
}
