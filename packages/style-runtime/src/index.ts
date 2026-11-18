type GlobalScopeWithStyleRuntime = typeof globalThis & {
	// This global is shared by separately bundled copies of this package.
	// Keep its shape backward compatible after release.
	__wpStyleRuntime?: {
		documents: Map< Document, number >;
		styles: Map< string, string >;
		injectedStyles: WeakMap< Document, Set< string > >;
	};
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

	const style = targetDocument.createElement( 'style' );
	style.setAttribute( STYLE_HASH_ATTRIBUTE, hash );
	style.appendChild( targetDocument.createTextNode( css ) );
	targetDocument.head.appendChild( style );
	injectedStyles.add( hash );
}

/**
 * Registers a document as a style injection target.
 *
 * Existing registered styles are replayed into the document immediately.
 * Documents are reference-counted so multiple providers can safely register the
 * same document without one cleanup removing it while another registration is
 * still active.
 *
 * @param targetDocument Document to receive registered styles.
 * @return Cleanup function that unregisters this document registration.
 */
export function registerDocument( targetDocument: Document ) {
	const runtime = getRuntime();

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
