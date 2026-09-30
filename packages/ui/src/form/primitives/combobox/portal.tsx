import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { getWpCompatOverlaySlot } from '../../../utils/wp-compat-overlay-slot';

/**
 * Root element that portals `Combobox` popup content. Pass to
 * `Combobox.Popup`'s `portal` prop. When `portal` is omitted,
 * `Combobox.Popup` uses this component with default props.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function ComboboxPortal( { container, ...restProps }, ref ) {
		return (
			<_Combobox.Portal
				container={ container ?? getWpCompatOverlaySlot() }
				{ ...restProps }
				ref={ ref }
			/>
		);
	}
);

export { Portal };
