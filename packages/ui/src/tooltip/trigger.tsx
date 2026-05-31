import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function TooltipTrigger( props, ref ) {
		return <_Tooltip.Trigger ref={ ref } { ...props } />;
	}
);

export { Trigger };
