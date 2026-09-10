import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Drawer`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function DrawerPortal( props, ref ) {
		return <_Drawer.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
