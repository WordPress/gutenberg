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
 * Prefer `RadioGroupControl` for standard labeled radio groups.
 *
 * Must wrap `Radio` items. For one labeled group, pass `RadioGroup` to
 * `Fieldset.Root`'s `render` prop. When a `Fieldset` contains multiple groups,
 * give each `RadioGroup` its own accessible name.
 */
export const RadioGroup = forwardRef( function UnforwardedRadioGroup< Value >(
	{ render = DEFAULT_RENDER, ...restProps }: RadioGroupProps< Value >,
	ref: React.ForwardedRef< HTMLDivElement >
) {
	return (
		<_RadioGroup< Value > ref={ ref } render={ render } { ...restProps } />
	);
} ) as < Value = unknown >(
	props: RadioGroupProps< Value > & React.RefAttributes< HTMLDivElement >
) => React.JSX.Element;
