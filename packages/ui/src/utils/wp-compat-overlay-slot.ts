import styles from './css/wp-compat-overlay-slot.module.css';

// Local casts for the auto-detect heuristic and the shared opt-in flag,
// kept off the global `Window` interface so this package's `.d.ts` doesn't
// leak `Window.wp` / `Window.__wpUiCompatOverlaySlotEnabled` augmentations.
type WpEnvironmentWindow = {
	wp?: {
		components?: unknown;
	};
};
type CompatOverlaySlotInternalWindow = {
	__wpUiCompatOverlaySlotEnabled?: boolean;
};

/**
 * Marker attribute on the compat overlay slot element.
 */
export const WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE = 'data-wp-compat-overlay-slot';

function resolveOwnerDocument(): Document | null {
	// Always the local document — not `window.top?.document`, which would
	// put the slot in a document where this bundle's CSS modules aren't
	// loaded (e.g. Storybook's preview iframe).
	return typeof document === 'undefined' ? null : document;
}

function isInWordPressEnvironment(): boolean {
	let topWp: WpEnvironmentWindow[ 'wp' ];
	try {
		// Try the top window first so an iframe (e.g. the editor canvas)
		// inherits the parent's WP environment.
		topWp = ( window.top as WpEnvironmentWindow | undefined )?.wp;
	} catch {
		// Cross-origin top window — fall through to the local window.
	}
	const wp = topWp ?? ( window as WpEnvironmentWindow ).wp;
	// Stricter than `!== undefined` so a stray non-object `components`
	// doesn't trigger auto-enable. Explicit null check covers
	// `typeof null === 'object'`.
	return typeof wp?.components === 'object' && wp.components !== null;
}

// Revalidated on each call against the current owner document and the
// slot's connection state.
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
 * Returns the body-level compat overlay slot when the runtime opts in,
 * lazily creating it on first call. Returns `undefined` otherwise — so the
 * return value can be forwarded straight to a `container` prop, leaving the
 * default portal container in effect.
 *
 * Two opt-in paths:
 *
 * - Auto-detected when `window.wp.components` is on the global — the
 *   typical script-loader setup for WordPress plugins and admin screens.
 * - Explicit, via `useEnableWpCompatOverlaySlot()` — for hosts that bundle
 *   `@wordpress/components` (or only `@wordpress/ui`) directly rather than
 *   relying on the global.
 *
 * The slot is a single `<div data-wp-compat-overlay-slot>` appended to the
 * local document's body. Subsequent calls return the same element; if it's
 * been removed it's recreated, and a slot created by another
 * `@wordpress/ui` instance in the same document is adopted rather than
 * duplicated.
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
	// `document.body` can be null if this runs before `<body>` is parsed
	// (e.g. a `<script>` in `<head>`). Bail rather than throw in `createSlot`.
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

	// Prefer an existing slot in the document over creating a duplicate —
	// this is how multiple `@wordpress/ui` instances share one slot.
	const existing = ownerDocument.querySelector< HTMLDivElement >(
		`[${ WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE }]`
	);
	if ( existing instanceof HTMLDivElement ) {
		cachedSlot = existing;
		return existing;
	}

	// Don't orphan a cached slot still attached to a foreign document.
	if ( cachedSlot?.isConnected ) {
		cachedSlot.remove();
	}

	cachedSlot = createSlot( ownerDocument );
	return cachedSlot;
}

/**
 * Test-only escape hatch that drops the cached singleton.
 */
export function __resetWpCompatOverlaySlotCacheForTests(): void {
	cachedSlot = null;
}
