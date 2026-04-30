import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Root element that portals `Autocomplete` popup content. Pass to
 * `Autocomplete.Popup`'s `portal` prop. When `portal` is omitted,
 * `Autocomplete.Popup` uses this component with default props.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function AutocompletePortal( props, ref ) {
		return <_Autocomplete.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
