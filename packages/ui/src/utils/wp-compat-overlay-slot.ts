import styles from './css/wp-compat-overlay-slot.module.css';

/**
 * Minimal shape of the WordPress runtime global. Local cast so the auto-
 * detect heuristic type-checks without leaking a `Window.wp` augmentation
 * into downstream TS consumers via this package's published `.d.ts`.
 */
type WpEnvironmentWindow = {
	wp?: {
		components?: unknown;
	};
};

/**
 * Cross-`@wordpress/ui`-instance shared store for the explicit opt-in.
 * Set by `useEnableWpCompatOverlaySlot()`; read here. Intentionally not
 * declared on the global `Window` interface — direct access is in-package
 * only and stays behind a local cast.
 */
type CompatOverlaySlotInternalWindow = {
	__wpUiCompatOverlaySlotEnabled?: boolean;
};

/**
 * Identifies the compat overlay slot DOM element. Used as the cross-
 * `@wordpress/ui`-instance singleton marker (see `getWpCompatOverlaySlot()`);
 * styling is delivered via the CSS-module class on the same element.
 */
export const WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE = 'data-wp-compat-overlay-slot';

/**
 * Resolves the document that should own the slot — always the local
 * document, i.e., the one the JS realm calling this helper sees as
 * `globalThis.document`. Not `window.top?.document`, which would put the
 * slot in a document where this bundle's CSS modules aren't loaded
 * (Storybook's preview iframe being the canonical example). "Is this a
 * WordPress environment?" (auto-detect) and "which document hosts the
 * slot?" (placement) are orthogonal; the helper always answers the
 * second with the local realm.
 */
function resolveOwnerDocument(): Document | null {
	if ( typeof document === 'undefined' ) {
		return null;
	}
	return document;
}

/**
 * Detects whether the runtime is a WordPress-flavored environment by
 * checking for `window.wp.components`. Tries the top window first so an
 * iframe (e.g., the editor canvas) inherits the parent's WP environment;
 * falls back to the local window. The `typeof === 'object'` check is
 * deliberately stricter than `!== undefined` so a stray non-object
 * `components` doesn't trigger auto-enable, and the explicit null
 * comparison covers `typeof null === 'object'`.
 */
function isInWordPressEnvironment(): boolean {
	let topWp: WpEnvironmentWindow[ 'wp' ];
	try {
		topWp = ( window.top as WpEnvironmentWindow | undefined )?.wp;
	} catch {
		// Cross-origin top window — fall through to the local window.
	}
	const wp = topWp ?? ( window as WpEnvironmentWindow ).wp;
	return typeof wp?.components === 'object' && wp.components !== null;
}

/**
 * Module-level cache. Revalidated on each call against the current owner
 * document and the slot's connection state. On miss, the helper falls
 * back to a DOM query for an existing slot before creating one — that's
 * what coordinates multiple `@wordpress/ui` package instances loaded on
 * the same page around a single DOM-level singleton via the
 * `[data-wp-compat-overlay-slot]` attribute.
 */
let cachedSlot: HTMLDivElement | null = null;

/**
 * Creates the slot element, tags it with the cross-instance singleton
 * attribute, applies the co-located CSS-module class, and appends it to
 * the given document's body. Callers must have already verified the gate
 * is open and `ownerDocument.body` exists.
 *
 * @param ownerDocument The document that should own and host the slot.
 */
function createSlot( ownerDocument: Document ): HTMLDivElement {
	const element = ownerDocument.createElement( 'div' );
	element.setAttribute( WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE, '' );
	if ( styles.slot ) {
		element.classList.add( styles.slot );
	}
	ownerDocument.body.appendChild( element );
	return element;
}

/**
 * Returns the body-level compat overlay slot element when the runtime
 * opts in, lazily creating it on first call. Returns `undefined`
 * otherwise, leaving the underlying overlay primitives' default portal
 * container in effect — so the return value can be forwarded straight
 * to a `container` prop.
 *
 * Two opt-in paths:
 *
 * - Auto-detected when `window.wp.components` is on the global — the
 *   typical script-loader setup for WordPress plugins and admin
 *   screens. Zero developer intervention required.
 * - Explicit, via `useEnableWpCompatOverlaySlot()` from a top-level
 *   component — for hosts that bundle `@wordpress/components` (or only
 *   `@wordpress/ui`) directly rather than relying on the global.
 *
 * The slot is a single `<div data-wp-compat-overlay-slot>` appended to
 * the local document's body (see `resolveOwnerDocument`) with styles
 * pinned via the co-located CSS module. Subsequent calls return the
 * same element; if it's been removed from the DOM it's recreated, and
 * if a different `@wordpress/ui` instance already created a slot in
 * the same document this call adopts it rather than appending a
 * duplicate.
 */
export function getWpCompatOverlaySlot(): HTMLDivElement | undefined {
	if ( typeof window === 'undefined' ) {
		return undefined;
	}

	if (
		! isInWordPressEnvironment() &&
		( window as CompatOverlaySlotInternalWindow )
			.__wpUiCompatOverlaySlotEnabled !== true
	) {
		return undefined;
	}

	const ownerDocument = resolveOwnerDocument();
	// `document.body` can be null if the helper runs before `<body>` is
	// parsed (e.g. a `<script>` in `<head>`). Bail rather than throw in
	// `createSlot`; callers fall through to the default portal container.
	if ( ! ownerDocument || ! ownerDocument.body ) {
		return undefined;
	}

	if (
		cachedSlot &&
		cachedSlot.ownerDocument === ownerDocument &&
		cachedSlot.isConnected
	) {
		return cachedSlot;
	}

	// DOM-level singleton: prefer an existing slot in the document over
	// creating a duplicate. Coordinates multiple `@wordpress/ui` package
	// instances around one slot via the attribute marker.
	const existing = ownerDocument.querySelector< HTMLDivElement >(
		`[${ WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE }]`
	);
	if ( existing instanceof HTMLDivElement ) {
		cachedSlot = existing;
		return existing;
	}

	// Detach any cached slot still attached to a foreign document, so we
	// don't orphan a slot in a document we no longer manage.
	if ( cachedSlot?.isConnected ) {
		cachedSlot.remove();
	}

	cachedSlot = createSlot( ownerDocument );
	return cachedSlot;
}

/**
 * Test-only escape hatch that drops the cached singleton so a fresh
 * element is created on the next `getWpCompatOverlaySlot()` call.
 */
export function __resetWpCompatOverlaySlotCacheForTests(): void {
	cachedSlot = null;
}
