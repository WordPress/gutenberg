import { useLayoutEffect } from '@wordpress/element';
import type { Decorator } from '@storybook/react-vite';
import { useEnableWpCompatOverlaySlot } from './use-enable-wp-compat-overlay-slot';

/**
 * Storybook decorator that opts a single story into the `@wordpress/ui`
 * compat overlay slot. Apply to stories that demonstrate slot behavior
 * (e.g., mixed-library Tooltip-inside-Modal stacking); leave stories
 * that reflect the dormant baseline untouched.
 *
 * Combines two opt-in surfaces:
 *
 * - `useEnableWpCompatOverlaySlot()` during render — sets the gate
 *   early enough that descendants in the same render pass (Tooltip's
 *   `Portal`, which reads the helper on every render) see it on first
 *   mount.
 * - A layout-effect mount/cleanup pair — the public hook is one-way by
 *   design (shared infrastructure shouldn't be turned off by any one
 *   component), but Storybook needs the opposite: navigating to an
 *   un-decorated story has to close the gate. Cleanup deletes the
 *   internal flag; mount re-asserts it so React 18 StrictMode's
 *   mount→cleanup→remount cycle ends with the flag set (otherwise leaf
 *   overlays that mount *later* — the playground's Modal-Tooltip —
 *   would find the gate closed). Real consumers don't have this
 *   fragility because they never unmount the opt-in; this is a
 *   Storybook accommodation kept local to the decorator.
 *
 * The cleanup deliberately does *not* detach the slot DOM node — empty
 * leftover slots are harmless (zero-content fixed-position shell), and
 * detaching mid-life would orphan still-mounted popups whose Portal
 * captured the slot reference at render time.
 *
 * Lives inside `@wordpress/ui` (rather than under root-level
 * `storybook/decorators/`) so per-component stories can import it as a
 * same-package file. The cross-library playground story imports it via
 * `packages/ui/...`, the normal upper-level → package direction.
 */
export const WithWpCompatOverlaySlot: Decorator = ( Story ) => {
	useEnableWpCompatOverlaySlot();

	useLayoutEffect( () => {
		const internalWindow = window as {
			__wpUiCompatOverlaySlotEnabled?: boolean;
		};
		internalWindow.__wpUiCompatOverlaySlotEnabled = true;
		return () => {
			delete ( window as { __wpUiCompatOverlaySlotEnabled?: boolean } )
				.__wpUiCompatOverlaySlotEnabled;
		};
	}, [] );

	return <Story />;
};
