import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { DrawerModalProvider } from './context';
import type { RootProps } from './types';

/**
 * An ARIA-compliant drawer that slides in from a viewport edge, with
 * swipe-to-dismiss gestures.
 *
 * Every drawer must include a `Drawer.Title` component for accessibility — it
 * serves as both the visible heading and the accessible label for the drawer.
 *
 * Always include a visible close affordance, either `Drawer.CloseIcon` or a
 * clear dismissing action button. If your drawer has a "Cancel" button in the
 * footer, the close icon may be redundant and create confusion about what
 * clicking "X" means.
 *
 * Use `Drawer.CloseIcon` for informational drawers where dismissing is safe
 * and expected. For drawers requiring explicit user choice (especially
 * destructive actions), omit the close icon and rely on footer action buttons
 * like "Cancel" and "Confirm" instead.
 */
function Root( {
	modal = true,
	swipeDirection = 'left',
	children,
	...props
}: RootProps ) {
	return (
		<_Drawer.Root
			modal={ modal }
			swipeDirection={ swipeDirection }
			{ ...props }
		>
			<DrawerModalProvider modal={ modal }>
				{ children }
			</DrawerModalProvider>
		</_Drawer.Root>
	);
}

export { Root };
