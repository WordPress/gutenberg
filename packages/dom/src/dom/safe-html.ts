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

// Mirrors `wp_kses_uri_attributes()`, as the Interactivity API's URL check
// does, plus the attributes that set the value of an SVG animation.
const URL_ATTRIBUTES = new Set( [
	'action',
	'archive',
	'background',
	'by',
	'cite',
	'classid',
	'codebase',
	'data',
	'formaction',
	'from',
	'href',
	'icon',
	'longdesc',
	'manifest',
	'poster',
	'profile',
	'src',
	'to',
	'usemap',
	'values',
	'xlink:href',
	'xlinkhref',
	'xmlns',
] );

// Same pattern as the Interactivity API: browsers ignore leading C0 controls
// and spaces, and tabs and newlines anywhere, in a URL's scheme.
const JAVASCRIPT_URL =
	/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;

function isJavaScriptURL( key: string, value: string ): boolean {
	if ( ! URL_ATTRIBUTES.has( key ) ) {
		return false;
	}

	// SVG animation values are a semicolon separated list.
	const urls = key === 'values' ? value.split( ';' ) : [ value ];
	return urls.some( ( url ) => JAVASCRIPT_URL.test( url ) );
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

			if ( key.startsWith( 'on' ) || isJavaScriptURL( key, value ) ) {
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
