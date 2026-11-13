import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { forwardRef } from '@wordpress/element';
import { useWpCompatOverlayContainer } from '../utils/use-wp-compat-overlay-container';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Drawer`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function DrawerPortal(
	{ container, ...restProps },
	ref
) {
	const portal = useWpCompatOverlayContainer( container );
	return (
		<>
			<span hidden ref={ portal.setSource } />
			<_Drawer.Portal
				ref={ ref }
				data-wp-ui-overlay-portal=""
				container={ portal.container }
				{ ...restProps }
			/>
		</>
	);
} );

export { Portal };
