import { Collapsible as _Collapsible } from '@base-ui/react/collapsible';
import { forwardRef } from '@wordpress/element';
import type { TriggerProps } from './types';

/**
 * A button that opens and closes the collapsible panel.
 *
 * `Collapsible` is a collection of React components that combine to render
 * a collapsible panel controlled by a button.
 */
export const Trigger = forwardRef< HTMLButtonElement, TriggerProps >(
	function CollapsibleTrigger( props, forwardedRef ) {
		return <_Collapsible.Trigger ref={ forwardedRef } { ...props } />;
	}
);
