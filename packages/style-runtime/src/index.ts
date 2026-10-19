type GlobalScopeWithStyleRuntime = typeof globalThis & {
	// This global is shared by separately bundled copies of this package.
	// Keep its shape backward compatible after release.
	__wpStyleRuntime?: {
		documents: Map< Document, number >;
		styles: Map< string, string >;
		injectedStyles: WeakMap< Document, Set< string > >;
		// Added after the first release, so a runtime created by an older
		// copy of this package doesn't have it until a nonce is set.
		nonces?: WeakMap< Document, string >;
	};
};

export type RegisterDocumentOptions = {
	/**
	 * Nonce to add to the style tags injected into the document, for
	 * documents with a Content Security Policy that only allows styles with
	 * a matching nonce.
	 */
	nonce?: string;
};

const STYLE_HASH_ATTRIBUTE = 'data-wp-hash';

/**
 * Returns the shared style runtime registry.
 *
 * The registry is stored on `globalThis` so separately bundled copies of this
 * package can coordinate through the same document and style maps.
 *
 * @return The shared runtime registry.
 */
function getRuntime() {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	if ( globalScope.__wpStyleRuntime ) {
		return globalScope.__wpStyleRuntime;
	}

	globalScope.__wpStyleRuntime = {
		documents: new Map(),
		styles: new Map(),
		injectedStyles: new WeakMap(),
	};

	if ( typeof document !== 'undefined' ) {
		registerDocument( document );
	}

	return globalScope.__wpStyleRuntime;
}

/**
 * Checks whether a document already contains a style tag for a hash.
 *
 * @param targetDocument Document to inspect.
 * @param hash           Stable hash for the transformed CSS.
 *
 * @return Whether the style hash already exists in the document.
 */
function documentContainsStyleHash(
	targetDocument: Document,
	hash: string
): boolean {
	if ( ! targetDocument.head ) {
		return false;
	}

	for ( const style of targetDocument.head.querySelectorAll(
		`style[${ STYLE_HASH_ATTRIBUTE }]`
	) ) {
		if ( style.getAttribute( STYLE_HASH_ATTRIBUTE ) === hash ) {
			return true;
		}
	}

	return false;
}

/**
 * Injects a registered style into a document, unless that document already
 * contains a style tag for the same hash.
 *
 * @param targetDocument Document to inject the style into.
 * @param hash           Stable hash for the transformed CSS.
 * @param css            CSS text to inject.
 */
function injectStyle( targetDocument: Document, hash: string, css: string ) {
	if ( ! targetDocument.head ) {
		return;
	}

	const runtime = getRuntime();
	let injectedStyles = runtime.injectedStyles.get( targetDocument );

	if ( ! injectedStyles ) {
		injectedStyles = new Set();
		runtime.injectedStyles.set( targetDocument, injectedStyles );
	}

	if ( injectedStyles.has( hash ) ) {
		return;
	}

	// Older generated CSS module output can still inject matching style tags
	// after this document's cache is created, so keep the DOM as the fallback
	// source of truth on cache misses.
	if ( documentContainsStyleHash( targetDocument, hash ) ) {
		injectedStyles.add( hash );
		return;
	}

	targetDocument.head.appendChild(
		createStyleElement(
			targetDocument,
			hash,
			css,
			runtime.nonces?.get( targetDocument )
		)
	);
	injectedStyles.add( hash );
}

/**
 * Sets the nonce for the style tags injected into a document.
 *
 * Style tags that were injected before the nonce was known, for example into
 * the root document when a CSS module was imported, are replaced with copies
 * that carry the nonce. Changing only the nonce attribute of an existing style
 * tag does not retry a stylesheet that the Content Security Policy blocked.
 *
 * @param targetDocument Document the nonce applies to.
 * @param nonce          Nonce to add to the style tags.
 */
function setDocumentNonce( targetDocument: Document, nonce: string ) {
	const runtime = getRuntime();

	if ( ! runtime.nonces ) {
		runtime.nonces = new WeakMap();
	}

	if ( runtime.nonces.get( targetDocument ) === nonce ) {
		return;
	}

	runtime.nonces.set( targetDocument, nonce );

	if ( ! targetDocument.head ) {
		return;
	}

	for ( const style of targetDocument.head.querySelectorAll< HTMLElement >(
		`style[${ STYLE_HASH_ATTRIBUTE }]`
	) ) {
		const hash = style.getAttribute( STYLE_HASH_ATTRIBUTE );
		const css = hash === null ? undefined : runtime.styles.get( hash );

		// Browsers can hide the nonce attribute from scripts, so read the
		// `nonce` property first.
		const styleNonce = style.nonce || style.getAttribute( 'nonce' );

		if ( hash === null || css === undefined || styleNonce === nonce ) {
			continue;
		}

		style.replaceWith(
			createStyleElement( targetDocument, hash, css, nonce )
		);
	}
}

/**
 * Creates a style tag for a registered style.
 *
 * @param targetDocument Document that will own the style tag.
 * @param hash           Stable hash for the transformed CSS.
 * @param css            CSS text of the style tag.
 * @param nonce          Optional nonce to add to the style tag.
 *
 * @return The style tag.
 */
function createStyleElement(
	targetDocument: Document,
	hash: string,
	css: string,
	nonce?: string
) {
	const style = targetDocument.createElement( 'style' );
	style.setAttribute( STYLE_HASH_ATTRIBUTE, hash );
	if ( nonce ) {
		style.setAttribute( 'nonce', nonce );
	}
	style.appendChild( targetDocument.createTextNode( css ) );
	return style;
}

/**
 * Registers a document as a style injection target.
 *
 * Existing registered styles are replayed into the document immediately.
 * Documents are reference-counted so multiple providers can safely register the
 * same document without one cleanup removing it while another registration is
 * still active.
 *
 * When a `nonce` is given, it is added to every style tag injected into the
 * document from then on, and style tags that were injected without it are
 * replaced. A registration without a `nonce` keeps the nonce that another
 * registration set for the same document.
 *
 * @param targetDocument Document to receive registered styles.
 * @param options        Registration options.
 * @param options.nonce  Nonce to add to the style tags injected into the
 *                       document.
 * @return Cleanup function that unregisters this document registration.
 */
export function registerDocument(
	targetDocument: Document,
	{ nonce }: RegisterDocumentOptions = {}
) {
	const runtime = getRuntime();

	if ( nonce ) {
		setDocumentNonce( targetDocument, nonce );
	}

	runtime.documents.set(
		targetDocument,
		( runtime.documents.get( targetDocument ) ?? 0 ) + 1
	);

	for ( const [ hash, css ] of runtime.styles ) {
		injectStyle( targetDocument, hash, css );
	}

	return () => {
		const count = runtime.documents.get( targetDocument );

		if ( count === undefined ) {
			return;
		}

		if ( count <= 1 ) {
			runtime.documents.delete( targetDocument );
			return;
		}

		runtime.documents.set( targetDocument, count - 1 );
	};
}

/**
 * Registers a style and injects it into all registered documents.
 *
 * The hash is used as the deduplication key, so calling this repeatedly with
 * the same hash will not add duplicate style tags to a document.
 * Registered styles are retained for the lifetime of the page so they can be
 * replayed into documents that are registered later.
 *
 * @param hash Stable hash for the transformed CSS.
 * @param css  CSS text to inject.
 */
export function registerStyle( hash: string, css: string ) {
	const runtime = getRuntime();

	runtime.styles.set( hash, css );

	for ( const targetDocument of runtime.documents.keys() ) {
		injectStyle( targetDocument, hash, css );
	}
}
