import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Popover`'s floating content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function PopoverPortal( props, ref ) {
		return <_Popover.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
