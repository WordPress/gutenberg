import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PortalProps } from './types';

/**
 * Used to apply custom portal behavior to `Select`'s listbox content.
 */
const Portal = forwardRef< HTMLDivElement, PortalProps >(
	function SelectPortal( props, ref ) {
		return <_Select.Portal ref={ ref } { ...props } />;
	}
);

export { Portal };
