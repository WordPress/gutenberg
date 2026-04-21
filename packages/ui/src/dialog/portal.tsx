import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Dialog` overlay content (`Backdrop`, inner
 * `Popup`, etc.) outside the DOM hierarchy. Pass to `Dialog.Popup`'s
 * `portal` prop to customize `container`, `className`, `style`, and other
 * Base UI portal options. When `portal` is omitted, `Dialog.Popup` uses this
 * component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function DialogPortal( props, ref ) {
		return <_Dialog.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
