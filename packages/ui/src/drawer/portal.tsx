import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { forwardRef } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '../utils/wp-compat-overlay-slot';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Drawer`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function DrawerPortal(
	{ container, ...restProps },
	ref
) {
	return (
		<_Drawer.Portal
			ref={ ref }
			container={
				container === undefined ? getWpCompatOverlaySlot() : container
			}
			{ ...restProps }
		/>
	);
} );

export { Portal };
