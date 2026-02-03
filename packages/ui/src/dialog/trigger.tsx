import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

/**
 * Renders a button that opens the dialog popup when clicked.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function DialogTrigger( props, ref ) {
		return <_Dialog.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
