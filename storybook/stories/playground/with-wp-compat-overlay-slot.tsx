import { useLayoutEffect } from '@wordpress/element';
import { useEnableWpCompatOverlaySlot } from '@wordpress/ui';
import type { Decorator } from '@storybook/react-vite';

/**
 * Storybook decorator that opts the decorated story into the
 * `@wordpress/ui` compat overlay slot. The cleanup clears the internal
 * flag on unmount so navigating to an un-decorated story closes the gate
 * again — `useEnableWpCompatOverlaySlot()` is one-way at runtime.
 *
 * Kept private to playground stories: applying it to per-component
 * stories would leak the window-level flag into sibling stories on the
 * same autodocs page.
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
