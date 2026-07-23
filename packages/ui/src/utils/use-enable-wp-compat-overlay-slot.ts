/**
 * Opts the host application into the `@wordpress/ui` compat overlay slot —
 * a body-level container into which `@wordpress/ui` overlays portal so they
 * reliably stack above `@wordpress/components` overlays in mixed-library
 * compositions.
 *
 * Call once from a component that mounts for the lifetime of the app
 * (typically the root). Idempotent and one-way: a single caller should not
 * be able to turn off shared infrastructure for everyone else; if the slot
 * isn't wanted, simply don't call this hook.
 *
 * Where `window.wp.components` is on the global — the typical setup for
 * plugins enqueueing `wp-components` through WordPress's script-loader —
 * the slot auto-enables and this hook is a no-op.
 */
export function useEnableWpCompatOverlaySlot(): void {
	if ( typeof window === 'undefined' ) {
		return;
	}

	// Applied during render (not in `useLayoutEffect`) so descendants in
	// the same render pass — e.g. `Tooltip.Portal`, which reads
	// `getWpCompatOverlaySlot()` on every render — see the gate open on
	// first mount. Safe to write during render: the value is an idempotent
	// boolean.
	const internalWindow = window as {
		__wpUiCompatOverlaySlotEnabled?: boolean;
	};
	if ( internalWindow.__wpUiCompatOverlaySlotEnabled !== true ) {
		internalWindow.__wpUiCompatOverlaySlotEnabled = true;
	}
}
