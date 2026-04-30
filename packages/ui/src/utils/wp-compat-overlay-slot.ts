import styles from './css/wp-compat-overlay-slot.module.css';

/**
 * Minimal shape of the WordPress runtime global, applied as a local cast
 * inside `isInWordPressEnvironment()` so the auto-detect heuristic
 * (`typeof wp.components === 'object'`) type-checks without leaking a
 * `Window.wp` augmentation into downstream TS consumers via this package's
 * published `.d.ts`. The real `wp.components` namespace is far richer; we
 * only care whether it exists.
 */
type WpEnvironmentWindow = {
	wp?: {
		components?: unknown;
	};
};

/**
 * Internal cross-`@wordpress/ui`-instance shared store for the explicit
 * opt-in. Set by `useEnableWpCompatOverlaySlot()`; read here. Deliberately
 * not declared on the global `Window` interface so consumers don't see it
 * as part of the public API surface — direct access is for in-package
 * callers only and stays behind a local cast.
 */
type CompatOverlaySlotInternalWindow = {
	__wpUiCompatOverlaySlotEnabled?: boolean;
};

/**
 * Attribute that identifies the compat overlay slot DOM element. Used as the
 * architectural marker for cross-tooling discovery and, crucially, for
 * cross-`@wordpress/ui`-instance singleton coordination (see
 * `getWpCompatOverlaySlot()`); styling is delivered via the CSS-module class
 * on the same element.
 *
 * Exported for tests and other in-package callers; not re-exported from the
 * package entry point.
 */
export const WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE = 'data-wp-compat-overlay-slot';

/**
 * Resolves the document that should own the slot — always the local
 * document, i.e., the one the JS realm calling this helper sees as
 * `globalThis.document`.
 *
 * This rule pairs cleanly with the two iframe patterns we care about:
 *
 * - An iframe that is a React `createPortal` boundary, not a script
 *   boundary (e.g. Gutenberg's editor canvas, or any `StyleProvider`-style
 *   embed). Components rendered inside the iframe keep running in the
 *   parent's JS realm; only their DOM lands in the iframe document. So a
 *   `@wordpress/ui` overlay inside that iframe calls this helper from the
 *   parent's realm, gets the parent's document, and its popup portals out
 *   to the parent's body — naturally escaping the iframe and stacking
 *   above any parent-document overlays. No cross-frame traversal needed.
 * - True script-boundary iframes (Storybook's preview iframe, embedded
 *   standalone apps, etc.) load their own bundle and run their own JS
 *   realm. The helper resolves to that iframe's document, the slot lives
 *   alongside the bundle that created it, and the bundle's CSS modules
 *   apply to the slot's classname.
 *
 * Why local-only and not `window.top?.document`: traversing up to the top
 * window would put the slot in a document where this bundle's CSS modules
 * aren't loaded (Storybook's preview iframe is the canonical example), so
 * the slot's classname would have nothing to match. "Is this a WordPress
 * environment?" (auto-detect) and "which document should host the slot?"
 * (frame placement) are orthogonal questions; the helper answers the
 * second by always using the local realm's document.
 */
function resolveOwnerDocument(): Document | null {
	if ( typeof document === 'undefined' ) {
		return null;
	}
	return document;
}

/**
 * Detects whether the runtime is a WordPress-flavored environment by
 * checking for `window.wp.components`. In WordPress (admin, plugins
 * enqueueing `wp-components`, etc.) the `@wordpress/components` package is
 * exposed as a global object, which the script-loader system sets up before
 * any consumer of `@wordpress/ui` runs. This is the dominant case — it lets
 * the slot auto-enable without any developer intervention.
 *
 * Tries the top window first so an iframe (e.g., the editor canvas) inherits
 * the parent's WP environment when its own window doesn't have `wp` set up.
 * Falls back to the local window. The `typeof === 'object'` check is
 * deliberately stricter than `!== undefined` so a stray `window.wp` global
 * with a non-object `components` (e.g., a string) doesn't trigger
 * auto-enable. `null` is rejected by the explicit null comparison because
 * `typeof null === 'object'`.
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
 * Cached reference to the slot. Revalidated on each call against the current
 * owner document and the slot's connection state, so a stale reference from
 * a previous owner document (e.g. test cleanup tearing down jsdom, or a
 * runtime-detected switch between cross-frame and local-doc placement) or
 * an externally-detached element doesn't get returned. A missed cache falls
 * through to a DOM query for an existing slot in the document before
 * creating a new one — that handles the case of multiple `@wordpress/ui`
 * package instances loaded on the same page (each with its own module-level
 * cache), letting them share a single DOM-level singleton via the
 * `[data-wp-compat-overlay-slot]` attribute.
 */
let cachedSlot: HTMLDivElement | null = null;

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
 * Returns the body-level compat overlay slot element when the runtime opts
 * in, lazily creating it on first call. Returns `null` otherwise, leaving
 * Base UI's default portal container in effect.
 *
 * Two opt-in paths:
 * - Auto-enabled by detecting `window.wp.components` on the global. This
 *   is the dominant case for plugins and admin screens that get
 *   `wp-components` enqueued through WordPress's script-loader, and it
 *   requires no developer intervention.
 * - Explicitly enabled by calling `useEnableWpCompatOverlaySlot()` from a
 *   top-level component — the public API for hosts that bundle
 *   `@wordpress/components` (or only `@wordpress/ui`) directly rather
 *   than relying on the global, e.g. standalone apps built on Vite,
 *   Next, etc.
 *
 * The slot is a single `<div data-wp-compat-overlay-slot>` appended to a
 * document body, with special styles (see the co-located CSS module for
 * details and reasoning). It exists so that `@wordpress/ui` overlays
 * reliably stack above `@wordpress/components` overlays in mixed-library
 * compositions without per-instance plumbing.
 *
 * Document placement: the slot lives in the document the helper is
 * called from — see `resolveOwnerDocument` for why a single, predictable
 * rule covers both Gutenberg's editor canvas iframe (which is a React
 * portal boundary, not a script boundary) and true script-boundary
 * iframes like Storybook's preview.
 *
 * Subsequent calls return the same element. If the element has been removed
 * from the DOM (e.g. by an unrelated script or a test teardown) it is
 * recreated transparently on the next call. If a different `@wordpress/ui`
 * package instance has already created a slot in the same document (e.g. on
 * a page that bundles multiple copies), this call adopts the existing
 * element rather than appending a duplicate — the
 * `[data-wp-compat-overlay-slot]` attribute is the cross-instance
 * coordination marker.
 *
 * A plain function — rather than a React hook — is appropriate here because
 * this is the consumer-side read API for `@wordpress/ui` overlays:
 * - The gating signals (auto-detect, internal opt-in flag) don't change at
 *   runtime, so there's no React state to subscribe to.
 * - The slot creation is synchronous DOM manipulation
 *   (`document.body.appendChild`), so no `useLayoutEffect` timing is needed.
 * - The same function shape works in any context (render or non-render).
 *
 * The opt-in side is a hook (`useEnableWpCompatOverlaySlot`) because writing
 * to global state from a render path is the kind of side effect that wants
 * effect-phase scheduling.
 */
export function getWpCompatOverlaySlot(): HTMLDivElement | null {
	if ( typeof window === 'undefined' ) {
		return null;
	}

	if (
		! isInWordPressEnvironment() &&
		( window as CompatOverlaySlotInternalWindow )
			.__wpUiCompatOverlaySlotEnabled !== true
	) {
		return null;
	}

	const ownerDocument = resolveOwnerDocument();
	// `document.body` can be null if the helper is called before `<body>` has
	// been parsed (e.g. from a `<script>` placed in `<head>` ahead of body).
	// Bail in that case rather than throwing in `createSlot`'s `appendChild`;
	// callers fall through to Base UI's default container, which is the same
	// no-op behavior as when neither gate fires.
	if ( ! ownerDocument || ! ownerDocument.body ) {
		return null;
	}

	if (
		cachedSlot &&
		cachedSlot.ownerDocument === ownerDocument &&
		cachedSlot.isConnected
	) {
		return cachedSlot;
	}

	// Look for a slot already in the document before creating a new one. This
	// handles the multiple-package-instances case: each instance has its own
	// module-level `cachedSlot`, but the DOM is the shared source of truth.
	// The attribute is the cross-instance singleton marker.
	const existing = ownerDocument.querySelector< HTMLDivElement >(
		`[${ WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE }]`
	);
	if ( existing instanceof HTMLDivElement ) {
		cachedSlot = existing;
		return existing;
	}

	// If the cached slot still belongs to a (different) document that owns
	// it, detach it before replacing the cache so we don't leave an orphaned
	// slot in a document we no longer manage. Slots that are already
	// disconnected (e.g. removed by a test or by external code in the same
	// document) need no cleanup here.
	if ( cachedSlot?.isConnected ) {
		cachedSlot.remove();
	}

	cachedSlot = createSlot( ownerDocument );
	return cachedSlot;
}

/**
 * Test-only escape hatch that drops the cached singleton so a fresh element
 * is created on the next `getWpCompatOverlaySlot()` call.
 */
export function __resetWpCompatOverlaySlotCacheForTests(): void {
	cachedSlot = null;
}
