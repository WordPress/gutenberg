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
 * Anywhere `window.wp.components` is on the global — the typical setup
 * for plugins enqueueing `wp-components` through WordPress's script-
 * loader — the slot auto-enables and this hook is a no-op. The hook
 * exists for apps that aren't built with standard WordPress build
 * tooling.
 *
 * Idempotent and safe to call from multiple components.
 */
export function useEnableWpCompatOverlaySlot(): void {
	if ( typeof window === 'undefined' ) {
		return;
	}

	// The opt-in is applied during render (not in `useLayoutEffect`) so
	// descendants in the same render pass — e.g. `Tooltip.Portal`, which
	// reads `getWpCompatOverlaySlot()` on every render — see the gate
	// open on first mount. Render-phase visibility extends only to
	// components rendered *after* this hook in the same pass; calling
	// from a top-level component keeps that invariant trivially
	// satisfied. An idempotent boolean write is the kind of side effect
	// render is allowed to emit: re-renders, StrictMode double-renders,
	// and multiple hook callers all collapse to the same final state.
	const internalWindow = window as {
		__wpUiCompatOverlaySlotEnabled?: boolean;
	};
	if ( internalWindow.__wpUiCompatOverlaySlotEnabled !== true ) {
		internalWindow.__wpUiCompatOverlaySlotEnabled = true;
	}
}
