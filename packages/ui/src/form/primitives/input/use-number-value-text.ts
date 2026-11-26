import type { InputProps } from './types';
import { useInputValue } from './use-input-value';

/**
 * Works around VoiceOver in Chrome on macOS, which reads a number input with a
 * `max` as a percentage of its range unless it has an `aria-valuetext`.
 * Safari and Firefox are not affected.
 *
 * Remove this hook once VoiceOver reads such an input as its value in Chrome.
 *
 * An uncontrolled input's value text follows user edits and form resets, but
 * not a value set directly on the element, which fires no event.
 *
 * @param props The input's props that affect its value text.
 */
export function useNumberValueText(
	props: Pick<
		InputProps,
		'type' | 'value' | 'defaultValue' | 'aria-valuetext' | 'onValueChange'
	>
) {
	const {
		type,
		value,
		defaultValue,
		'aria-valuetext': ariaValueText,
		onValueChange,
	} = props;
	const needsValueText = type === 'number' && ariaValueText === undefined;

	const {
		ref,
		value: valueText,
		onValueChange: handleValueChange,
	} = useInputValue( {
		value,
		defaultValue,
		onValueChange,
		enabled: needsValueText,
	} );

	return {
		ref,
		'aria-valuetext': needsValueText
			? valueText || undefined
			: ariaValueText,
		onValueChange: handleValueChange,
	};
}
