import { forwardRef } from 'react';
import * as Dialog from '../dialog';
import { type TriggerProps } from './types';

const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function ConfirmDialogTrigger( props, ref ) {
		return <Dialog.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
