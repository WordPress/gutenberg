import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { DrawerModalProvider } from './context';
import type { RootProps } from './types';

/**
 * Groups the drawer trigger and popup.
 *
 * `Drawer` is a collection of React components that combine to render
 * an ARIA-compliant drawer pattern with slide-in behavior and
 * swipe-to-dismiss gestures.
 */
function Root( { modal, children, ...props }: RootProps ) {
	return (
		<_Drawer.Root modal={ modal } { ...props }>
			<DrawerModalProvider modal={ modal }>
				{ children }
			</DrawerModalProvider>
		</_Drawer.Root>
	);
}

export { Root };
