/**
 * External dependencies
 */
import { Tooltip } from '@base-ui/react/tooltip';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
