import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Autocomplete`'s popup content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AutocompletePortal( props, ref ) {
		return <_Autocomplete.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
