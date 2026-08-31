import { forwardRef } from '@wordpress/element';
import { Button } from '../button';
import type { ButtonProps } from '../button/types';

const OverflowTriggerButton = forwardRef< HTMLButtonElement, ButtonProps >(
	function OverflowTriggerButton( { children, ...props }, ref ) {
		return (
			<Button
				{ ...props }
				ref={ ref }
				size="small"
				tone="neutral"
				variant="minimal"
			>
				{ children ?? <span aria-hidden="true">…</span> }
			</Button>
		);
	}
);

export { OverflowTriggerButton };
