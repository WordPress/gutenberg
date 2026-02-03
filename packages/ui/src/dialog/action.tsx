/**
 * External dependencies
 */
import { forwardRef } from 'react';
import { Dialog } from '@base-ui/react/dialog';

/**
 * Internal dependencies
 */
import { type ActionProps } from './types';
import { Button } from '../button';

const Action = forwardRef< HTMLButtonElement, ActionProps >(
	function DialogAction( { render, ...props }, ref ) {
		return (
			<Dialog.Close
				ref={ ref }
				render={ <Button render={ render } /> }
				{ ...props }
			/>
		);
	}
);

export { Action };
