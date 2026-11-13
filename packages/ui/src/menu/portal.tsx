import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import { useWpCompatOverlayContainer } from '../utils/use-wp-compat-overlay-container';
import type { PortalProps } from './types';

/**
 * Portals the menu popup to the document body by default.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function MenuPortal(
	{ container, ...props },
	ref
) {
	const portal = useWpCompatOverlayContainer( container );
	return (
		<>
			<span hidden ref={ portal.setSource } />
			<_Menu.Portal
				ref={ ref }
				data-wp-ui-overlay-portal=""
				container={ portal.container }
				{ ...props }
			/>
		</>
	);
} );

export { Portal };
