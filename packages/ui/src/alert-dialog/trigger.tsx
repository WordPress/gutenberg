import { AlertDialog as _AlertDialog } from '@base-ui/react/alert-dialog';
import { forwardRef } from '@wordpress/element';

import type { TriggerProps } from './types';

/**
 * Renders a button that opens the alert dialog when clicked.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function AlertDialogTrigger( props, ref ) {
		return <_AlertDialog.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
