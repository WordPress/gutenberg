import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '../utils/wp-compat-overlay-slot';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Dialog`'s overlay content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function DialogPortal(
	{ container, ...restProps },
	ref
) {
	return (
		<_Dialog.Portal
			ref={ ref }
			container={
				container === undefined ? getWpCompatOverlaySlot() : container
			}
			{ ...restProps }
		/>
	);
} );

export { Portal };
