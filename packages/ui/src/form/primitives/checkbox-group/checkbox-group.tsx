import { CheckboxGroup as _CheckboxGroup } from '@base-ui/react/checkbox-group';
import { forwardRef } from '@wordpress/element';
import type { CheckboxGroupProps } from './types';
import { Stack } from '../../../stack';

const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
	<Stack { ...props } direction="column" gap="sm" />
);

/**
 * A low-level primitive that groups checkboxes so they share one selected-values
 * state.
 *
 * Prefer composing `CheckboxControl` inside the group for labeled items. For
 * one labeled group, pass `CheckboxGroup` to `Fieldset.Root`'s `render` prop.
 * When a `Fieldset` contains multiple groups, give each `CheckboxGroup` its own
 * accessible name.
 */
export const CheckboxGroup = forwardRef< HTMLDivElement, CheckboxGroupProps >(
	function CheckboxGroup( { render = DEFAULT_RENDER, ...restProps }, ref ) {
		return (
			<_CheckboxGroup ref={ ref } render={ render } { ...restProps } />
		);
	}
);
