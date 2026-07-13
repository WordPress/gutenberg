/**
 * Finds a single standalone iframe element from markup when it is safe to use
 * for direct preview rendering.
 *
 * @param {string} html Markup to inspect.
 * @return {HTMLIFrameElement|null} The iframe element when safe, otherwise null.
 */
function getSafeStandaloneIframeElement( html ) {
	if ( ! html?.trim() ) {
		return null;
	}

	if (
		typeof window.DOMParser === 'undefined' ||
		typeof window.Node === 'undefined'
	) {
		return null;
	}

	const parsedDocument = new window.DOMParser().parseFromString(
		html,
		'text/html'
	);
	const { body } = parsedDocument;

	if ( ! body || body.childElementCount !== 1 ) {
		return null;
	}

	const iframe = body.firstElementChild;

	if ( ! iframe || iframe.tagName !== 'IFRAME' ) {
		return null;
	}

	for ( const node of body.childNodes ) {
		if ( node === iframe ) {
			continue;
		}

		if (
			node.nodeType === window.Node.TEXT_NODE &&
			! node.textContent?.trim()
		) {
			continue;
		}

		return null;
	}

	if ( iframe.hasAttribute( 'srcdoc' ) ) {
		return null;
	}

	for ( const attribute of Array.from( iframe.attributes ) ) {
		if ( attribute.name.toLowerCase().startsWith( 'on' ) ) {
			return null;
		}
	}

	const src = iframe.getAttribute( 'src' )?.trim();

	if ( ! src ) {
		return null;
	}

	if ( /^(?:javascript|data|vbscript):/i.test( src ) ) {
		return null;
	}

	if ( ! /^(?:https?:)?\/\//i.test( src ) ) {
		return null;
	}

	return iframe;
}

/**
 * Returns true when the markup is exactly one safe standalone iframe.
 *
 * @param {string} html Markup to inspect.
 * @return {boolean} Whether markup is a safe standalone iframe snippet.
 */
export function isSafeStandaloneIframeMarkup( html ) {
	return !! getSafeStandaloneIframeElement( html );
}

/**
 * Returns sanitized iframe props for direct preview rendering.
 *
 * @param {string} html Markup to inspect.
 * @return {Object|null} Safe iframe props, or null when markup is not eligible.
 */
export function getSafeStandaloneIframeProps( html ) {
	const iframe = getSafeStandaloneIframeElement( html );

	if ( ! iframe ) {
		return null;
	}

	const src = iframe.getAttribute( 'src' )?.trim();

	if ( ! src ) {
		return null;
	}

	const allow = iframe.getAttribute( 'allow' )?.trim();
	const title = iframe.getAttribute( 'title' )?.trim();
	const loading = iframe.getAttribute( 'loading' )?.trim();
	const referrerPolicy = iframe.getAttribute( 'referrerpolicy' )?.trim();
	const frameBorder = iframe.getAttribute( 'frameborder' )?.trim();
	const scrolling = iframe.getAttribute( 'scrolling' )?.trim();

	return {
		src,
		allow,
		title,
		loading,
		referrerPolicy,
		frameBorder,
		scrolling,
		allowFullScreen: iframe.hasAttribute( 'allowfullscreen' ),
	};
}
