import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import { forwardRef } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '../utils/wp-compat-overlay-slot';
import type { PortalProps } from './types';

/**
 * Portals navigation flyouts to the document body by default.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function NavigationMenuPortal( { container, ...props }, ref ) {
		return (
			<_NavigationMenu.Portal
				ref={ ref }
				container={ container ?? getWpCompatOverlaySlot() }
				{ ...props }
			/>
		);
	}
);

export { Portal };
