import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Popover` floating content. Pass to
 * `Popover.Popup`'s `portal` prop (for example `container` for
 * cross-document rendering). When `portal` is omitted, `Popover.Popup` uses
 * this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function PopoverPortal( props, ref ) {
		return <_Popover.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
