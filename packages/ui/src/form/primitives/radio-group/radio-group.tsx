import { RadioGroup as _RadioGroup } from '@base-ui/react/radio-group';
import { forwardRef } from '@wordpress/element';
import type { RadioGroupProps } from './types';
import { Stack } from '../../../stack';

const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
	<Stack { ...props } direction="column" gap="sm" />
);

/**
 * A low-level primitive that groups radio buttons so they share one selected
 * value.
 *
 * Must wrap `Radio` items. For one labeled group, pass `RadioGroup` to
 * `Fieldset.Root`'s `render` prop. When a `Fieldset` contains multiple groups,
 * give each `RadioGroup` its own accessible name.
 */
export const RadioGroup = forwardRef< HTMLDivElement, RadioGroupProps >(
	function RadioGroup( { render = DEFAULT_RENDER, ...restProps }, ref ) {
		return <_RadioGroup ref={ ref } render={ render } { ...restProps } />;
	}
);
