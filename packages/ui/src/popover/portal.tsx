import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { getWpCompatOverlaySlot } from '../utils/wp-compat-overlay-slot';

/**
 * Used to apply custom portal behavior to `Popover`'s floating content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function PopoverPortal( { container, ...restProps }, ref ) {
		return (
			<_Popover.Portal
				container={ container ?? getWpCompatOverlaySlot() }
				{ ...restProps }
				ref={ ref }
			/>
		);
	}
);

export { Portal };
