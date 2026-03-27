import { forwardRef } from '@wordpress/element';

import * as Dialog from '../dialog';
import type { TriggerProps } from './types';

/**
 * Renders a button that opens the alert dialog when clicked.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function AlertDialogTrigger( props, ref ) {
		return <Dialog.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
