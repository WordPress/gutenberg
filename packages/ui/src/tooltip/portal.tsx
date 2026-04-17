import { Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { ComponentPropsWithoutRef } from 'react';

export type PortalProps = ComponentPropsWithoutRef< typeof Tooltip.Portal >;

/**
 * Root element that portals `Tooltip` floating content. Pass to
 * `Tooltip.Popup`'s `portal` prop. When `portal` is omitted, `Tooltip.Popup`
 * uses this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function TooltipPortal( props, ref ) {
		return <Tooltip.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
