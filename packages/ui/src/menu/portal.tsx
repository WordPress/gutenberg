import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import { wpCompatOverlaySlotContainer } from '../utils/wp-compat-overlay-slot';
import type { PortalProps } from './types';

/**
 * Portals the menu popup to the document body by default.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function MenuPortal(
	{ container, ...props },
	ref
) {
	return (
		<_Menu.Portal
			ref={ ref }
			container={
				container === undefined
					? wpCompatOverlaySlotContainer
					: container
			}
			{ ...props }
		/>
	);
} );

export { Portal };
