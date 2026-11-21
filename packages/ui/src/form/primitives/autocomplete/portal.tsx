import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { wpCompatOverlaySlotContainer } from '../../../utils/wp-compat-overlay-slot';

/**
 * Used to apply custom portal behavior to `Autocomplete`'s popup content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AutocompletePortal( { container, ...restProps }, ref ) {
		return (
			<_Autocomplete.Portal
				container={
					container === undefined
						? wpCompatOverlaySlotContainer
						: container
				}
				{ ...restProps }
				ref={ ref }
			/>
		);
	}
);

export { Portal };
