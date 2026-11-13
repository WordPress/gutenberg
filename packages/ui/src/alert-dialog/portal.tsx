import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { forwardRef } from '@wordpress/element';
import { useWpCompatOverlayContainer } from '../utils/use-wp-compat-overlay-container';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `AlertDialog`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AlertDialogPortal( { container, ...props }, ref ) {
		const portal = useWpCompatOverlayContainer( container );
		return (
			<>
				<span hidden ref={ portal.setSource } />
				<_AlertDialog.Portal
					ref={ ref }
					data-wp-ui-overlay-portal=""
					container={ portal.container }
					{ ...props }
				/>
			</>
		);
	}
);

export { Portal };
