import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Select` listbox content. Pass to
 * `Select.Popup`'s `portal` prop. When `portal` is omitted, `Select.Popup`
 * uses this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function SelectPortal( props, ref ) {
		return <_Select.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
