import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import type { ActionProps } from './types';

/**
 * Renders a button that closes the dialog when clicked.
 * Accepts all Button component props for styling.
 */
const Action = forwardRef< HTMLButtonElement, ActionProps >(
	function DialogAction( { render, ...props }, ref ) {
		return (
			<_Dialog.Close
				ref={ ref }
				render={ <Button render={ render } /> }
				{ ...props }
			/>
		);
	}
);

export { Action };
