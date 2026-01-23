import { Collapsible } from '@base-ui/react/collapsible';
import { cloneElement, forwardRef } from '@wordpress/element';
import type { HTMLProps } from 'react';
import type { TriggerProps } from './types';

const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function CollapsibleTrigger( { children, ...props }, ref ) {
		const render = ( renderProps: HTMLProps< HTMLElement > ) =>
			cloneElement( children, renderProps );

		return (
			<Collapsible.Trigger render={ render } ref={ ref } { ...props } />
		);
	}
);

export { Trigger };
