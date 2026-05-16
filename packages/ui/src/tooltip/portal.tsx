import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { getWpCompatOverlaySlot } from '../utils/wp-compat-overlay-slot';

/**
 * Used to apply custom portal behavior to `Tooltip`'s floating content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function TooltipPortal( { container, ...restProps }, ref ) {
		return (
			<_Tooltip.Portal
				container={ container ?? getWpCompatOverlaySlot() }
				{ ...restProps }
				ref={ ref }
			/>
		);
	}
);

export { Portal };
