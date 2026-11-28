import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import type { ActionProps } from './types';

/**
 * Renders a button that closes the dialog when clicked.
 * Accepts all Button component props for styling.
 */
const Action = forwardRef< HTMLButtonElement, ActionProps >(
	function DialogAction( { render, disabled, loading, ...props }, ref ) {
		// Resolve `disabled` the same way Button does so that
		// _Dialog.Close's internal useButton (which controls
		// aria-disabled) stays in sync with the rendered Button.
		const resolvedDisabled = disabled ?? loading;

		return (
			<_Dialog.Close
				ref={ ref }
				render={ <Button render={ render } loading={ loading } /> }
				disabled={ resolvedDisabled }
				{ ...props }
			/>
		);
	}
);

export { Action };
