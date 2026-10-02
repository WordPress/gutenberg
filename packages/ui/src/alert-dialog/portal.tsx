import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `AlertDialog`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AlertDialogPortal( props, ref ) {
		return <_AlertDialog.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
