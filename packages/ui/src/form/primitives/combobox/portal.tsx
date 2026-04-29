import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Combobox` popup content. Pass to
 * `Combobox.Popup`'s `portal` prop. When `portal` is omitted,
 * `Combobox.Popup` uses this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function ComboboxPortal( props, ref ) {
		return <_Combobox.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
