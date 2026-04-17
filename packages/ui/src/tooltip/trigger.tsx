import { Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function TooltipTrigger( { children, ...props }, ref ) {
		return (
			<Tooltip.Trigger ref={ ref } { ...props }>
				{ children }
			</Tooltip.Trigger>
		);
	}
);

export { Trigger };
