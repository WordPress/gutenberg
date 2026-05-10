import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Drawer` overlay content (`Backdrop`, `Viewport`
 * with the inner `Popup`, etc.) outside the DOM hierarchy. Pass to
 * `Drawer.Popup`'s `portal` prop to customize `container`, `className`,
 * `style`, and other Base UI portal options. When `portal` is omitted,
 * `Drawer.Popup` uses this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function DrawerPortal( props, ref ) {
		return <_Drawer.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
