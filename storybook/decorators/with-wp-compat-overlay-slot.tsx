import { useLayoutEffect } from '@wordpress/element';
import type { Decorator } from '@storybook/react-vite';

// Hardcoded rather than imported from `@wordpress/ui` because the helper
// (and its `WP_COMPAT_OVERLAY_SLOT_ATTRIBUTE` constant) is internal — not
// re-exported from the package entry point. A single duplicated string in
// Storybook-only code is cheaper than threading a private internal entry.
const SLOT_ATTRIBUTE = 'data-wp-compat-overlay-slot';

declare global {
	interface Window {
		__wpUiCompatOverlaySlotEnabled?: boolean;
	}
}

/**
 * Storybook decorator that opts a single story into the `@wordpress/ui`
 * compat overlay slot. Apply to stories that demonstrate slot behavior
 * (e.g., mixed-library Tooltip-inside-Modal stacking); leave stories that
 * should reflect the dormant baseline (the standard `@wordpress/ui`
 * consumer experience) untouched.
 *
 * Sets the window flag in a layout effect (runs synchronously after the
 * first render, before browser paint, and crucially before user-driven
 * interactions like hover that mount Tooltip popups). Cleans up on
 * unmount so navigating to a different (un-decorated) story returns to
 * the dormant baseline:
 * - Clears the window flag.
 * - Removes any slot DOM nodes left in `document.body`.
 *
 * Uses the explicit flag rather than mocking `window.wp.components`:
 * Storybook isn't a WP environment, so spoofing the WP global mixes "are
 * we testing WP?" with "are we testing the slot?". The slot's runtime
 * behavior is gate-agnostic once enabled.
 */
export const WithWpCompatOverlaySlot: Decorator = ( Story ) => {
	useLayoutEffect( () => {
		window.__wpUiCompatOverlaySlotEnabled = true;
		return () => {
			delete window.__wpUiCompatOverlaySlotEnabled;
			document
				.querySelectorAll( `[${ SLOT_ATTRIBUTE }]` )
				.forEach( ( el ) => el.remove() );
		};
	}, [] );
	return <Story />;
};
