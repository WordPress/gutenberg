import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { CloseProps } from './types';

/**
 * Renders a button that closes the popover when clicked.
 */
const Close = forwardRef< HTMLButtonElement, CloseProps >(
	function PopoverClose( props, ref ) {
		return (
			<_Popover.Close
				ref={ ref }
				data-wp-ui-popover-close=""
				{ ...props }
			/>
		);
	}
);

export { Close };
