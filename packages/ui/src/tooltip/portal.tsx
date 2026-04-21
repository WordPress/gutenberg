import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Tooltip` floating content. Pass to
 * `Tooltip.Popup`'s `portal` prop. When `portal` is omitted, `Tooltip.Popup`
 * uses this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function TooltipPortal( props, ref ) {
		return <_Tooltip.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
