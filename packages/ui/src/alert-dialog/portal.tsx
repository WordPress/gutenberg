import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `AlertDialog` overlay content. Pass to
 * `AlertDialog.Popup`'s `portal` prop to customize the portal target and
 * wrapper. When `portal` is omitted, `AlertDialog.Popup` uses this component
 * with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AlertDialogPortal( props, ref ) {
		return <_AlertDialog.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
