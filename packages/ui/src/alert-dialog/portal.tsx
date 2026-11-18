import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { forwardRef } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '../utils/wp-compat-overlay-slot';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `AlertDialog`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AlertDialogPortal( { container, ...props }, ref ) {
		return (
			<_AlertDialog.Portal
				ref={ ref }
				container={
					container === undefined
						? getWpCompatOverlaySlot()
						: container
				}
				{ ...props }
			/>
		);
	}
);

export { Portal };
