/**
 * Internal dependencies
 */
import { shortestCommonSupersequence } from './scs';

export type StyleElement = HTMLLinkElement | HTMLStyleElement;

/**
 * Returns true when two style elements represent the same stylesheet resource.
 *
 * Strips `media` from both clones before comparing so that a sheet whose
 * `media` was mutated at runtime (e.g. "not all" → "all") and the same sheet
 * as returned by the server (still "not all") are treated as one node. Without
 * this, the SCS algorithm would insert a duplicate and applyStyles() would
 * disable the activated sheet on the next navigation.
 *
 * @param a `<style>` or `<link>` element.
 * @param b `<style>` or `<link>` element.
 * @return Whether the two elements represent the same stylesheet resource.
 */
const areNodesEqual = ( a: StyleElement, b: StyleElement ): boolean => {
	const aClone = a.cloneNode( true ) as StyleElement;
	const bClone = b.cloneNode( true ) as StyleElement;
	aClone.removeAttribute( 'media' );
	bClone.removeAttribute( 'media' );
	return aClone.isEqualNode( bClone );
};

/**
 * The set of style elements the router is allowed to disable.
 *
 * Seeded once at module init from every identified stylesheet (those carrying
 * an `id` attribute) already in the document. Stylesheets injected by plugins
 * after module init carry no `id` and are therefore never enrolled — the router
 * leaves them untouched on every navigation.
 *
 * Additional elements are enrolled by applyStyles() on their first activation
 * out of `media="preload"` state.
 */
const routerManagedStyles = new Set< StyleElement >(
	Array.from(
		document.querySelectorAll< StyleElement >(
			'link[rel=stylesheet][id], style[id]'
		)
	)
);

/**
 * Returns a normalised clone of the element suitable for media-agnostic
 * comparison. The original element is never mutated.
 *
 * - `media="preload"` → restored to `data-original-media` (or "all")
 * - `media=""` or `media="not all"` → normalised to "all"
 *
 * WordPress defers optional stylesheets with `media="not all"`. Normalising
 * that value to "all" means the live activated element (media="all") and the
 * server-returned element (media="not all") produce the same normalised form,
 * letting areNodesEqual() and the SCS algorithm recognise them as the same
 * resource.
 *
 * @param element `<style>` or `<link>` element.
 * @return Normalised clone of the element.
 */
export const normalizeMedia = ( element: StyleElement ): StyleElement => {
	element = element.cloneNode( true ) as StyleElement;
	const media = element.media;
	const { originalMedia } = element.dataset;

	if ( media === 'preload' ) {
		element.media = originalMedia || 'all';
		element.removeAttribute( 'data-original-media' );
	} else if ( ! element.media || element.media === 'not all' ) {
		element.media = 'all';
	}
	return element;
};

/**
 * Merges the current page's style list (X) with the incoming page's style
 * list (Y) using the Shortest Common Supersequence algorithm and returns a
 * load promise for every element in Y.
 *
 * Elements present in both lists are matched media-agnostically via
 * areNodesEqual() so the live DOM node from X — which may carry a mutated
 * `media` attribute — is reused instead of being replaced. New elements
 * (only in Y) are inserted next to their neighbours and given
 * `media="preload"` so the browser fetches them silently until applyStyles()
 * activates them.
 *
 * When X is empty all elements in Y are appended to `parent`.
 *
 * @param X      Current page's style elements.
 * @param Y      Incoming page's style elements.
 * @param parent Target parent for new nodes. Defaults to `document.head`.
 * @return Promises resolving once each element in Y is ready.
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

	const xNormalized = X.map( normalizeMedia );
	const yNormalized = Y.map( normalizeMedia );

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
		const xElement = X[ xIndex ];
		const yElement = Y[ yIndex ];
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
 * Per-element load promise cache, keyed by element reference.
 *
 * Ensures each element's load event is bound at most once and that every
 * caller waiting on the same element shares the same Promise.
 */
const stylePromiseCache = new WeakMap<
	StyleElement,
	Promise< StyleElement >
>();

/**
 * Returns a Promise that resolves once the given element has finished loading.
 *
 * Elements already in the document and not in preload state resolve
 * immediately. New elements receive `media="preload"` so the browser fetches
 * the resource without applying its styles; applyStyles() clears the sentinel
 * when the page renders. Inline `<style>` elements resolve immediately.
 * Results are memoised in stylePromiseCache.
 *
 * @param element Style or link element to prepare.
 * @return Promise resolving to the element once it is ready.
 */
const prepareStylePromise = (
	element: StyleElement
): Promise< StyleElement > => {
	if ( stylePromiseCache.has( element ) ) {
		return stylePromiseCache.get( element );
	}

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
 * Collects all style elements from the incoming document, inserts the minimum
 * required set into `window.document` via updateStylesWithSCS, and returns a
 * load promise for each.
 *
 * New elements receive `media="preload"` and are activated by applyStyles()
 * once the page is ready. May transfer nodes out of `doc`.
 *
 * @param doc Parsed document for the incoming page.
 * @return Promises resolving once each style element in `doc` is ready.
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

	return updateStylesWithSCS( currentStyleElements, newStyleElements );
};

/**
 * Enables only the stylesheets in `styles` and disables the rest, leaving
 * anonymous plugin-injected stylesheets untouched.
 *
 * - **In `styles`**: enabled. On first activation out of `media="preload"`
 *   the original media value is restored and the element is enrolled in
 *   routerManagedStyles for future navigation cycles.
 * - **Enrolled but absent**: disabled so it does not bleed into unrelated pages.
 * - **Neither** (never enrolled): left untouched — covers plugin stylesheets
 *   injected after module init that bypassed the preload cycle entirely.
 *
 * Because areNodesEqual() in updateStylesWithSCS() already matches live
 * activated elements media-agnostically and places them in `styles` by
 * identity, a plain `styles.includes()` check is sufficient here.
 *
 * @param styles Style elements belonging to the incoming page.
 */
export const applyStyles = ( styles: StyleElement[] ) => {
	window.document
		.querySelectorAll< StyleElement >( 'style,link[rel=stylesheet]' )
		.forEach( ( el ) => {
			if ( ! el.sheet ) {
				return;
			}
			if ( styles.includes( el ) ) {
				if ( el.sheet.media.mediaText === 'preload' ) {
					const { originalMedia = 'all' } = el.dataset;
					el.sheet.media.mediaText = originalMedia;
					routerManagedStyles.add( el );
				}
				el.sheet.disabled = false;
			} else if ( routerManagedStyles.has( el ) ) {
				el.sheet.disabled = true;
			}
		} );
};
