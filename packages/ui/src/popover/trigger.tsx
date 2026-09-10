import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

/**
 * Renders a button that toggles the popover popup when clicked.
 *
 * Renders as a `<button>` by default. Also supports hover-triggered
 * popovers via the `openOnHover`, `delay`, and `closeDelay` props.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function PopoverTrigger( props, ref ) {
		return <_Popover.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
