import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { forwardRef } from '@wordpress/element';
import { wpCompatOverlaySlotContainer } from '../utils/wp-compat-overlay-slot';
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
						? wpCompatOverlaySlotContainer
						: container
				}
				{ ...props }
			/>
		);
	}
);

export { Portal };
