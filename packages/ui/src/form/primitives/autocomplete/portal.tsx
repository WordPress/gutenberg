import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';
import { useWpCompatOverlayContainer } from '../../../utils/use-wp-compat-overlay-container';

/**
 * Used to apply custom portal behavior to `Autocomplete`'s popup content.
 * `container` defaults to the `@wordpress/ui` compat overlay slot.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AutocompletePortal( { container, ...restProps }, ref ) {
		const portal = useWpCompatOverlayContainer( container );
		return (
			<>
				<span hidden ref={ portal.setSource } />
				<_Autocomplete.Portal
					container={ portal.container }
					{ ...restProps }
					ref={ ref }
					data-wp-ui-overlay-portal=""
				/>
			</>
		);
	}
);

export { Portal };
