import { forwardRef } from '@wordpress/element';

import * as Dialog from '../dialog';
import type { TriggerProps } from './types';

/**
 * Renders a button that opens the confirmation dialog when clicked.
 */
const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function ConfirmDialogTrigger( props, ref ) {
		return <Dialog.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
