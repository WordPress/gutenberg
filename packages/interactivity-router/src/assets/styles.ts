import { shortestCommonSupersequence } from './scs';
import {
	canonicalizeStyleElement,
	getTargetMedia,
	isUnmanagedPreloadLink,
} from './async-styles';

export type StyleElement = HTMLLinkElement | HTMLStyleElement;

/**
 * Normalizes the passed style or link element, reverting the changes
 * made by {@link prepareStylePromise|`prepareStylePromise`} to the
 * `data-original-media` and `media`.
 *
 * @example
 * The following elements should be normalized to the same element:
 * ```html
 * <link rel="stylesheet" src="./assets/styles.css">
 * <link rel="stylesheet" src="./assets/styles.css" media="all">
 * <link rel="stylesheet" src="./assets/styles.css" media="preload">
 * <link rel="stylesheet" src="./assets/styles.css" media="preload" data-original-media="all">
 * ```
 *
 * @param element `<style>` or `<link>` element.
 * @return Normalized node.
 */
export const normalizeMedia = ( element: StyleElement ): StyleElement => {
	element = element.cloneNode( true ) as StyleElement;
	const media = element.media;
	const { originalMedia } = element.dataset;

	if ( media === 'preload' ) {
		element.media = originalMedia || 'all';
		element.removeAttribute( 'data-original-media' );
	} else if ( ! element.media ) {
		element.media = 'all';
	}
	return element;
};

/**
 * Selector of the style elements handled by the router.
 *
 * Apart from the regular style sheets, it includes the preloads that turn
 * themselves into style sheets once they have been loaded, which are discarded
 * later if they are plain resource hints. Note that `[rel=stylesheet]` doesn't
 * match `rel="alternate stylesheet"`, which is intentionally excluded.
 */
const styleElementsSelector =
	'style,link[rel=stylesheet],link[rel=preload][as=style][onload]';

/**
 * Value of the `data-wp-router-style` attribute, which lets themes and plugins
 * override how the router handles a style element.
 *
 * - `ignore`: the router behaves as if the element didn't exist.
 * - `persist`: the router loads and enables the element, but never disables it.
 */
type RouterStyleMarker = 'ignore' | 'persist';

/**
 * Returns the marker present in the `data-wp-router-style` attribute of the
 * passed style element.
 *
 * @param element `<style>` or `<link>` element.
 * @return Marker of the element, or `null` when it doesn't carry a valid one.
 */
const getRouterStyleMarker = (
	element: StyleElement
): RouterStyleMarker | null => {
	const value = element.dataset.wpRouterStyle?.trim().toLowerCase();
	return value === 'ignore' || value === 'persist' ? value : null;
};

/**
 * Returns all the style elements contained in the passed document.
 *
 * The elements marked with `data-wp-router-style="ignore"` are excluded, so the
 * router doesn't take them into account anywhere: they are never marked as
 * managed, never inserted from a fetched page, never enabled or disabled, and
 * never used to place the elements of a new page.
 *
 * @param doc Document instance.
 * @return List of `<style>` and `<link>` elements that contain style sheets.
 */
const getStyleElements = ( doc: Document ): StyleElement[] =>
	Array.from(
		doc.querySelectorAll< StyleElement >( styleElementsSelector )
	).filter(
		( element ) =>
			! isUnmanagedPreloadLink( element ) &&
			getRouterStyleMarker( element ) !== 'ignore'
	);

/**
 * Canonical representation of a style element, used to compare elements coming
 * from different documents.
 *
 * `<link>` elements are identified by the URL they point to and the media they
 * end up applying to, so an element that an optimization plugin mutated in the
 * browser still matches its server-rendered markup. The rest of the elements,
 * and the links without a usable URL, fall back to comparing a normalized clone
 * of the node.
 */
interface StyleDescriptor {
	/** Canonical key of a `<link>` element, `null` when there is none. */
	key: string | null;
	/** Normalized clone, used when there is no canonical key. */
	node: StyleElement;
}

/**
 * Returns the canonical key of the passed element, if it can be computed.
 *
 * @param element `<style>` or `<link>` element.
 * @param baseUrl URL of the document the element belongs to, used to resolve
 *                relative URLs.
 * @return Canonical key, or `null` when the element is not a `<link>` or its
 * URL cannot be resolved.
 */
const getLinkKey = (
	element: StyleElement,
	baseUrl: string
): string | null => {
	if ( element.localName !== 'link' ) {
		return null;
	}
	const href = element.getAttribute( 'href' );
	if ( ! href ) {
		return null;
	}
	try {
		return `${ new URL( href, baseUrl ).href }|${ getTargetMedia(
			element
		) }`;
	} catch {
		return null;
	}
};

/**
 * Returns the canonical descriptor of the passed style element.
 *
 * The passed element is never modified.
 *
 * @param element `<style>` or `<link>` element.
 * @param baseUrl URL of the document the element belongs to, used to resolve
 *                relative URLs.
 * @return Descriptor of the passed element.
 */
const getStyleDescriptor = (
	element: StyleElement,
	baseUrl: string
): StyleDescriptor => ( {
	key: getLinkKey( element, baseUrl ),
	node: normalizeMedia( element ),
} );

/**
 * Compares the passed descriptors to check if they refer to style elements that
 * can be considered equal.
 *
 * @param a Descriptor of a `<style>` or `<link>` element.
 * @param b Descriptor of a `<style>` or `<link>` element.
 * @return Whether they are considered equal.
 */
const areDescriptorsEqual = (
	a: StyleDescriptor,
	b: StyleDescriptor
): boolean =>
	a.key !== null && b.key !== null
		? a.key === b.key
		: a.node.isEqualNode( b.node );

/**
 * Style elements that are managed by the router.
 *
 * These are the elements that came in a server response: either those present
 * in the initial HTML document, or those inserted by the router itself during
 * a navigation. The router only disables, enables or moves these elements.
 *
 * Style elements injected by other client-side scripts, e.g., dark mode
 * switchers, consent managers or lazy-loaded style sheets, are not part of
 * this set, so they are left untouched across navigations.
 */
const managedStyles = new WeakSet< StyleElement >();

/**
 * Whether the initial style elements could not be marked as managed.
 *
 * When that happens, the router falls back to managing every style element in
 * the document, which is the behavior it had before this distinction existed.
 */
let markingFailed = false;

/**
 * Returns whether the passed style element is managed by the router.
 *
 * @param element `<style>` or `<link>` element.
 * @return Whether the router manages the passed element.
 */
const isManaged = ( element: StyleElement ): boolean =>
	markingFailed || managedStyles.has( element );

/**
 * Marks the style elements of the initial page as managed by the router.
 *
 * The router needs a snapshot of the server-rendered markup to tell apart the
 * style elements that came in the initial HTML response from those that were
 * injected later by other client-side scripts. The request is made with
 * `cache: 'force-cache'`, so the browser serves the cached response of the
 * current page whenever there is one, and only hits the network otherwise.
 *
 * The returned promise never rejects. When the initial page cannot be fetched
 * or parsed, a flag is set so the router manages every style element, just
 * like it did before.
 *
 * @return Promise that resolves once the initial style elements are marked.
 */
const markInitialStylesAsManaged = async (): Promise< void > => {
	try {
		const url = new URL( window.location.href );
		url.hash = '';
		const res = await window.fetch( url.href, { cache: 'force-cache' } );
		if ( ! res.ok ) {
			markingFailed = true;
			return;
		}
		const html = await res.text();
		const doc = new window.DOMParser().parseFromString( html, 'text/html' );

		// Descriptors of the elements of the server response, consumed as they
		// are matched so each of them marks at most one element in the
		// document.
		const serverDescriptors = getStyleElements( doc ).map( ( element ) =>
			getStyleDescriptor( element, url.href )
		);

		getStyleElements( window.document ).forEach( ( element ) => {
			const descriptor = getStyleDescriptor(
				element,
				window.document.baseURI
			);
			const index = serverDescriptors.findIndex( ( serverDescriptor ) =>
				areDescriptorsEqual( descriptor, serverDescriptor )
			);
			if ( index !== -1 ) {
				serverDescriptors.splice( index, 1 );
				managedStyles.add( element );
			}
		} );
	} catch {
		markingFailed = true;
	}
};

/**
 * Promise that resolves once the style elements of the initial page have been
 * marked as managed by the router.
 *
 * The request starts as soon as this module is evaluated, and it is memoized
 * in this constant.
 */
export const initialStylesMarked: Promise< void > =
	markInitialStylesAsManaged();

/**
 * Adds the minimum style elements from Y around those in X using a
 * shortest common supersequence algorithm, returning a list of
 * promises for all the elements in Y.
 *
 * If X is empty, it appends all elements in Y to the passed parent
 * element or to `document.head` instead.
 *
 * The returned promises resolve once the corresponding style element
 * is loaded and ready. Those elements that are also in X return a
 * cached promise.
 *
 * The algorithm ensures that the final style elements present in the
 * document (or the passed `parent` element) are in the correct order
 * and they are included in either X or Y.
 *
 * @param X       Base list of style elements, which belong to the current
 *                document.
 * @param Y       List of style elements.
 * @param parent  Optional parent element to append to the new style elements.
 * @param baseUrl Optional URL of the document the elements in Y come from, used
 *                to resolve their relative URLs.
 * @return List of promises that resolve once the elements in Y are ready.
 */
export function updateStylesWithSCS(
	X: StyleElement[],
	Y: StyleElement[],
	parent: Element = window.document.head,
	baseUrl: string = window.document.baseURI
) {
	if ( X.length === 0 ) {
		return Y.map( ( element ) => {
			const promise = prepareStylePromise( element );
			parent.appendChild( element );
			// Elements inserted by the router are managed by definition.
			managedStyles.add( element );
			return promise;
		} );
	}

	// Create the descriptors used for comparison, computed only once as the
	// algorithm below compares every element in X with every element in Y.
	const xDescriptors = X.map( ( element ) =>
		getStyleDescriptor( element, window.document.baseURI )
	);
	const yDescriptors = Y.map( ( element ) =>
		getStyleDescriptor( element, baseUrl )
	);

	// The `scs` array contains descriptors.
	const scs = shortestCommonSupersequence(
		xDescriptors,
		yDescriptors,
		areDescriptorsEqual
	);
	const xLength = X.length;
	const yLength = Y.length;
	const promises = [];
	let last = X[ xLength - 1 ];
	let xIndex = 0;
	let yIndex = 0;

	for ( const scsElement of scs ) {
		// Actual elements that will end up in the DOM.
		const xElement = X[ xIndex ];
		const yElement = Y[ yIndex ];
		// Descriptors for comparison.
		const xDescriptor = xDescriptors[ xIndex ];
		const yDescriptor = yDescriptors[ yIndex ];
		if (
			xIndex < xLength &&
			areDescriptorsEqual( xDescriptor, scsElement )
		) {
			if (
				yIndex < yLength &&
				areDescriptorsEqual( yDescriptor, scsElement )
			) {
				promises.push( prepareStylePromise( xElement ) );
				yIndex++;
			}
			xIndex++;
		} else {
			promises.push( prepareStylePromise( yElement ) );
			if ( xIndex < xLength ) {
				xElement.before( yElement );
			} else {
				last.after( yElement );
				last = yElement;
			}
			// Elements inserted by the router are managed by definition.
			managedStyles.add( yElement );
			yIndex++;
		}
	}

	return promises;
}

/**
 * Cache of promises per style elements.
 *
 * Each style element has their own associated `Promise` that resolves
 * once the element has been loaded and is ready.
 */
const stylePromiseCache = new WeakMap<
	StyleElement,
	Promise< StyleElement >
>();

/**
 * Prepares and returns the corresponding `Promise` for the passed style
 * element.
 *
 * It returns the cached promise if it exists. Otherwise, constructs
 * a `Promise` that resolves once the element has finished loading.
 *
 * For those elements that are not in the DOM yet, this function
 * injects a `media="preload"` attribute to the passed element so the
 * style is loaded without applying any styles to the document.
 *
 * @param element Style element.
 * @return The associated `Promise` to the passed element.
 */
const prepareStylePromise = (
	element: StyleElement
): Promise< StyleElement > => {
	if ( stylePromiseCache.has( element ) ) {
		return stylePromiseCache.get( element );
	}

	// When the element exists in the main document and its media attribute
	// is not "preload", that means the element comes from the initial page.
	// The `media` attribute doesn't need to be handled in this case.
	if ( window.document.contains( element ) && element.media !== 'preload' ) {
		const promise = Promise.resolve( element );
		stylePromiseCache.set( element, promise );
		return promise;
	}

	if ( element.hasAttribute( 'media' ) && element.media !== 'all' ) {
		element.dataset.originalMedia = element.media;
	}

	element.media = 'preload';

	if ( element instanceof HTMLStyleElement ) {
		const promise = Promise.resolve( element );
		stylePromiseCache.set( element, promise );
		return promise;
	}

	const promise = new Promise< HTMLLinkElement >( ( resolve, reject ) => {
		element.addEventListener( 'load', () => resolve( element ) );
		element.addEventListener( 'error', ( event ) => {
			const { href } = event.target as HTMLLinkElement;
			reject(
				Error(
					`The style sheet with the following URL failed to load: ${ href }`
				)
			);
		} );
	} );

	stylePromiseCache.set( element, promise );
	return promise;
};

/**
 * Prepares all style elements contained in the passed document.
 *
 * This function calls {@link updateStylesWithSCS|`updateStylesWithSCS`}
 * to insert only the minimum amount of style elements into the DOM, so
 * those present in the passed document end up in the DOM while the order
 * is respected.
 *
 * New appended style elements contain a `media=preload` attribute to
 * make them effectively disabled until they are applied with the
 * {@link applyStyles|`applyStyles`} function.
 *
 * Style elements injected by other client-side scripts are excluded from the
 * merge, so they are left untouched and keep applying to the new page. The same
 * happens with the elements marked with `data-wp-router-style="ignore"`, on both
 * the current document and the new page.
 *
 * Note that this function alters the passed document, as it can transfer
 * nodes from it to the global document, and rewrites the style elements that
 * are loaded asynchronously to the state they end up in once they are loaded.
 *
 * @param doc     Document instance.
 * @param pageUrl Optional URL of the passed document, used to resolve the
 *                relative URLs of its style elements.
 * @return A list of promises for each style element in the passed document.
 */
export const preloadStyles = (
	doc: Document,
	pageUrl?: string
): Promise< StyleElement >[] => {
	const isCurrentDocument = doc === window.document;
	let baseUrl = window.document.baseURI;

	if ( ! isCurrentDocument && pageUrl ) {
		try {
			baseUrl = new URL( pageUrl, window.location.href ).href;
		} catch {}
	}

	const currentStyleElements = getStyleElements( window.document ).filter(
		isManaged
	);

	// Elements parsed from a page fetched by the router are server-rendered by
	// definition. That's not the case when the passed document is the current
	// one, which happens when the router prepares the initial page.
	const newStyleElements = isCurrentDocument
		? getStyleElements( doc ).filter( isManaged )
		: getStyleElements( doc );

	// Only the elements that the router adopts are rewritten. Those of the
	// current document are managed by the scripts that inserted them.
	if ( ! isCurrentDocument ) {
		newStyleElements.forEach( canonicalizeStyleElement );
	}

	// Set styles in order.
	return updateStylesWithSCS(
		currentStyleElements,
		newStyleElements,
		window.document.head,
		baseUrl
	);
};

/**
 * Traverses all style elements in the DOM, enabling only those included
 * in the passed list and disabling the others.
 *
 * If the style element has the `data-original-media` attribute, the
 * original `media` value is restored.
 *
 * Style elements injected by other client-side scripts are skipped, so they
 * are neither enabled nor disabled. The elements marked with
 * `data-wp-router-style="persist"` are enabled like the rest, but they are
 * never disabled.
 *
 * @param styles List of style elements to apply.
 */
export const applyStyles = ( styles: StyleElement[] ) => {
	getStyleElements( window.document )
		.filter( isManaged )
		.forEach( ( el ) => {
			if ( el.sheet ) {
				if ( styles.includes( el ) ) {
					// Only update mediaText when necessary.
					if ( el.sheet.media.mediaText === 'preload' ) {
						const { originalMedia = 'all' } = el.dataset;
						el.sheet.media.mediaText = originalMedia;
					}
					el.sheet.disabled = false;
				} else if ( getRouterStyleMarker( el ) !== 'persist' ) {
					el.sheet.disabled = true;
				}
			}
		} );
};
