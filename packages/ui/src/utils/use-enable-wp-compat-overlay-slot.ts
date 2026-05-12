/**
 * Opts the host application into the `@wordpress/ui` compat overlay slot —
 * a body-level positioned container into which `@wordpress/ui` overlays
 * portal so they reliably stack above `@wordpress/components` overlays in
 * mixed-library compositions.
 *
 * Call once from a component that mounts for the lifetime of the app
 * (typically the root). The opt-in is intentionally one-way: the slot is
 * shared infrastructure across every `@wordpress/ui` consumer in the same
 * document, and a single component shouldn't be able to turn it off for
 * everyone else. If the slot isn't wanted, simply don't call this hook.
 *
 * Anywhere `window.wp.components` is exposed on the global — the typical
 * setup for plugins enqueueing `wp-components` through WordPress's
 * script-loader — the slot auto-enables, so calling this hook is a no-op
 * (and unnecessary). The hook exists for hosts that bundle
 * `@wordpress/components` (or only `@wordpress/ui`) directly into their
 * app rather than relying on the global — apps that aren't built with
 * standard WordPress build tooling.
 *
 * Idempotent: safe to call from multiple components or multiple times in
 * the same component.
 *
 * Timing: the opt-in is applied during the calling component's render so
 * that descendants of the hook caller in the same render pass — Tooltip's
 * `Portal`, etc. — read it through `getWpCompatOverlaySlot()` and pick up
 * the slot on first mount. Siblings rendered *before* the hook caller in
 * the same pass won't see the flag until their next render — call the
 * hook from a top-level component so every consumer is a descendant. The
 * set is a single boolean assignment to a cross-instance shared store; it
 * is idempotent and safe to repeat, including under React.StrictMode's
 * double-render.
 */
export function useEnableWpCompatOverlaySlot(): void {
	if ( typeof window === 'undefined' ) {
		return;
	}

	// The window flag is the cross-`@wordpress/ui`-instance shared store
	// the helper reads. It is intentionally undeclared on the global
	// `Window` interface — the hook is the public API; any direct access
	// is internal and stays behind a local cast.
	//
	// The set is performed during render, not in a `useLayoutEffect`,
	// because effects fire *after* the initial render commits — by which
	// time descendants that resolve the gate during render (Tooltip's
	// `Portal` reads `getWpCompatOverlaySlot()` on every render to pick
	// its container) have already seen the slot disabled and rendered
	// against the default portal container. Render-phase visibility
	// extends only to components rendered *after* this hook in the same
	// pass — i.e. descendants of the caller. The "call from a top-level
	// component" guidance in the JSDoc keeps that invariant trivially
	// satisfied. A pure idempotent boolean write is the kind of side
	// effect render is allowed to emit: repeated calls (re-renders,
	// StrictMode double-renders, multiple hook callers) all collapse to
	// the same final state.
	const internalWindow = window as {
		__wpUiCompatOverlaySlotEnabled?: boolean;
	};
	if ( internalWindow.__wpUiCompatOverlaySlotEnabled !== true ) {
		internalWindow.__wpUiCompatOverlaySlotEnabled = true;
	}
}
