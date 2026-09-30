import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { getWpCompatOverlaySlot } from '../../../utils/wp-compat-overlay-slot';

/**
 * Used to apply custom portal behavior to `Select`'s listbox content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >( function SelectPortal(
	{ container, ...restProps },
	ref
) {
	return (
		<_Select.Portal
			container={ container ?? getWpCompatOverlaySlot() }
			{ ...restProps }
			ref={ ref }
		/>
	);
} );

export { Portal };
