import { shortestCommonSupersequence } from './scs';

export type StyleElement = HTMLLinkElement | HTMLStyleElement;

/**
 * Attribute added by the server to every `<style>` and
 * `<link rel="stylesheet">` element it renders on pages where client-side
 * navigation is enabled.
 */
const ROUTER_MANAGED_ATTRIBUTE = 'data-wp-router-managed';

/**
 * Whether the initial document marked its style assets with the
 * {@link ROUTER_MANAGED_ATTRIBUTE|router-managed attribute}.
 *
 * See {@link initRouterManagedMode|`initRouterManagedMode`}.
 */
let routerManagedMode = false;

/**
 * Style elements the router considers server-rendered and, therefore, subject
 * to being enabled or disabled depending on the page being rendered.
 *
 * In managed mode, elements not included here are client-owned — e.g.,
 * injected at runtime by scripts unaware of the router — and are never
 * disabled nor enabled by the router.
 */
const serverManagedStyles = new WeakSet< StyleElement >();

/**
 * Style elements disabled by the router itself in
 * {@link applyStyles|`applyStyles`}.
 *
 * Used to distinguish them from elements disabled by client scripts, which
 * must keep their state: the router only re-enables what it disabled.
 */
const routerDisabledStyles = new WeakSet< StyleElement >();

/**
 * Detects whether the router should honor the
 * {@link ROUTER_MANAGED_ATTRIBUTE|router-managed attribute}, initializes the
 * mode accordingly, and classifies the marked elements of the initial
 * document as server-managed.
 *
 * Detection is based on the initial live document only and is decided once,
 * at router initialization. A document containing at least one marked style
 * asset is in "managed mode": from then on, style elements present in the
 * live document without the marker are considered client-owned and are left
 * untouched across navigations. Documents without any marker keep the
 * previous behavior, where every style element in the DOM is managed by the
 * router.
 *
 * The marked elements are claimed here, eagerly, rather than waiting for the
 * initial page to be prepared. Preparing that page is asynchronous — it
 * awaits hydration — while a navigation can be triggered synchronously, so
 * {@link applyStyles|`applyStyles`} may run first. Elements exclusive to the
 * initial page are never passed to
 * {@link prepareStylePromise|`prepareStylePromise`} by
 * {@link updateStylesWithSCS|`updateStylesWithSCS`}, so without this eager
 * pass they would stay enabled on the destination page.
 *
 * The mode never flips afterwards, even on mixed navigations:
 *
 * - Marked initial page → managed mode for the whole session, even when
 *   navigating to unmarked pages. Knowing which live elements were injected
 *   by client scripts does not expire, and styles coming from unmarked
 *   fetched pages are server-rendered by definition, so they still become
 *   server-managed.
 * - Unmarked initial page → previous behavior forever, even when a fetched
 *   page is marked. Elements already swept into management cannot be
 *   reclassified safely: demoting the initial page's (unmarked) server
 *   styles would leave them enabled and stale on every future page. Behaving
 *   like before is the safe failure direction.
 */
export const initRouterManagedMode = () => {
	const marked = window.document.querySelectorAll< StyleElement >(
		`style[${ ROUTER_MANAGED_ATTRIBUTE }],link[rel=stylesheet][${ ROUTER_MANAGED_ATTRIBUTE }]`
	);
	routerManagedMode = marked.length > 0;
	marked.forEach( ( el ) => serverManagedStyles.add( el ) );
};

/**
 * Compares the passed style or link elements to check if they can be
 * considered equal.
 *
 * @param a `<style>` or `<link>` element.
 * @param b `<style>` or `<link>` element.
 * @return Whether they are considered equal.
 */
const areNodesEqual = ( a: StyleElement, b: StyleElement ): boolean =>
	a.isEqualNode( b );

/**
 * Normalizes the passed style or link element, reverting the changes
 * made by {@link prepareStylePromise|`prepareStylePromise`} to the
 * `data-original-media` and `media`.
 *
 * It also removes the
 * {@link ROUTER_MANAGED_ATTRIBUTE|router-managed attribute}, so an element
 * rendered by a server that marks its style assets and an otherwise
 * identical one rendered by a server that doesn't are still considered
 * equal. Otherwise, navigating between marked and unmarked pages would
 * insert a duplicate of every shared style element.
 *
 * As a consequence, a client-injected element that happens to be identical
 * to a marked style of a fetched page is matched and reused instead of
 * duplicated, so that page's style list can contain a client-owned element
 * the router will never enable nor disable. This is an accepted trade-off:
 * the alternative duplicates every shared style element on mixed
 * navigations.
 *
 * @example
 * The following elements should be normalized to the same element:
 * ```html
 * <link rel="stylesheet" src="./assets/styles.css">
 * <link rel="stylesheet" src="./assets/styles.css" media="all">
 * <link rel="stylesheet" src="./assets/styles.css" media="preload">
 * <link rel="stylesheet" src="./assets/styles.css" media="preload" data-original-media="all">
 * <link rel="stylesheet" src="./assets/styles.css" data-wp-router-managed>
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

	element.removeAttribute( ROUTER_MANAGED_ATTRIBUTE );

	return element;
};

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
 * @param X      Base list of style elements.
 * @param Y      List of style elements.
 * @param parent Optional parent element to append to the new style elements.
 * @return List of promises that resolve once the elements in Y are ready.
 */
export function updateStylesWithSCS(
	X: StyleElement[],
	Y: StyleElement[],
	parent: Element = window.document.head
) {
	if ( X.length === 0 ) {
		return Y.map( ( element ) => {
			const promise = prepareStylePromise( element );
			parent.appendChild( element );
			return promise;
		} );
	}

	// Create normalized arrays for comparison.
	const xNormalized = X.map( normalizeMedia );
	const yNormalized = Y.map( normalizeMedia );

	// The `scs` array contains normalized elements.
	const scs = shortestCommonSupersequence(
		xNormalized,
		yNormalized,
		areNodesEqual
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
		// Normalized elements for comparison.
		const xNormEl = xNormalized[ xIndex ];
		const yNormEl = yNormalized[ yIndex ];
		if ( xIndex < xLength && areNodesEqual( xNormEl, scsElement ) ) {
			if ( yIndex < yLength && areNodesEqual( yNormEl, scsElement ) ) {
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
	// In managed mode, an element already present in the live document that
	// lacks the marker attribute was injected by a client script, so it is
	// never owned by the router. Elements coming from fetched documents are
	// not in the live document yet, so they are server-rendered by
	// definition. Ownership is sticky: once server-managed, always
	// server-managed, which is what keeps elements from unmarked fetched
	// pages managed after they are inserted into the DOM.
	if (
		! routerManagedMode ||
		element.hasAttribute( ROUTER_MANAGED_ATTRIBUTE ) ||
		! window.document.contains( element )
	) {
		serverManagedStyles.add( element );
	}

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
 * Note that this function alters the passed document, as it can transfer
 * nodes from it to the global document.
 *
 * @param doc Document instance.
 * @return A list of promises for each style element in the passed document.
 */
export const preloadStyles = ( doc: Document ): Promise< StyleElement >[] => {
	const currentStyleElements = Array.from(
		window.document.querySelectorAll< StyleElement >(
			'style,link[rel=stylesheet]'
		)
	);
	const newStyleElements = Array.from(
		doc.querySelectorAll< StyleElement >( 'style,link[rel=stylesheet]' )
	);

	// Set styles in order.
	return updateStylesWithSCS( currentStyleElements, newStyleElements );
};

/**
 * Traverses all style elements in the DOM, enabling only those included
 * in the passed list and disabling the others.
 *
 * If the style element has the `data-original-media` attribute, the
 * original `media` value is restored.
 *
 * In managed mode, client-owned elements — e.g., injected at runtime by
 * scripts unaware of the router, like consent managers or theme switchers —
 * are left untouched, so their styles keep applying across client-side
 * navigations. The router also only re-enables elements it disabled itself,
 * so a stylesheet a client script disabled before the router claimed it
 * keeps its state. Note this does not hold once the router has claimed an
 * element: a client disabling a stylesheet the router had already disabled
 * is indistinguishable from the router's own change, and the element is
 * re-enabled when its page is rendered again. When the initial page didn't
 * mark its style assets, every style element in the DOM is managed, just
 * like in previous versions. See
 * {@link initRouterManagedMode|`initRouterManagedMode`}.
 *
 * @param styles List of style elements to apply.
 */
export const applyStyles = ( styles: StyleElement[] ) => {
	window.document
		.querySelectorAll( 'style,link[rel=stylesheet]' )
		.forEach( ( el: HTMLLinkElement | HTMLStyleElement ) => {
			if ( ! el.sheet ) {
				return;
			}
			if ( styles.includes( el ) ) {
				// Only update mediaText when necessary.
				if ( el.sheet.media.mediaText === 'preload' ) {
					const { originalMedia = 'all' } = el.dataset;
					el.sheet.media.mediaText = originalMedia;
				}
				// In managed mode, only re-enable elements the router itself
				// disabled, so a stylesheet a client script disabled before
				// the router claimed it keeps its state.
				if ( ! routerManagedMode || routerDisabledStyles.has( el ) ) {
					el.sheet.disabled = false;
				}
				routerDisabledStyles.delete( el );
			} else if ( ! routerManagedMode ) {
				// Without markers, keep the previous behavior: disable
				// everything that is not in the list.
				el.sheet.disabled = true;
			} else if ( serverManagedStyles.has( el ) && ! el.sheet.disabled ) {
				// Only claim elements that are currently enabled, so an
				// element disabled by a client script is not later
				// re-enabled by the router.
				el.sheet.disabled = true;
				routerDisabledStyles.add( el );
			}
		} );
};
