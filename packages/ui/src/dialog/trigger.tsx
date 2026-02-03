/**
 * External dependencies
 */
import { forwardRef } from 'react';
import { Dialog } from '@base-ui/react/dialog';

/**
 * Internal dependencies
 */
import { type TriggerProps } from './types';

const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function DialogTrigger( props, ref ) {
		return <Dialog.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
