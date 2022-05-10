/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../ui/context';
import type { ToggleGroupControlOptionProps } from '../types';
import { ToggleGroupControlOptionBase } from '../toggle-group-control-option-base';

export default function ToggleGroupControlOption(
	props: WordPressComponentProps<
		ToggleGroupControlOptionProps,
		'button',
		false
	>
) {
	const { label, ...restProps } = props;
	const optionLabel = restProps[ 'aria-label' ] || label;
	return (
		<ToggleGroupControlOptionBase
			{ ...restProps }
			aria-label={ optionLabel }
		>
			{ label }
		</ToggleGroupControlOptionBase>
	);
}

/**
 * `ToggleGroupControlOption` is a form component and is meant to be used as a
 * child of `ToggleGroupControl`.
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalToggleGroupControl as ToggleGroupControl,
 *   __experimentalToggleGroupControlOption as ToggleGroupControlOption,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ToggleGroupControl label="my label" value="vertical" isBlock>
 *       <ToggleGroupControlOption value="horizontal" label="Horizontal" />
 *       <ToggleGroupControlOption value="vertical" label="Vertical" />
 *     </ToggleGroupControl>
 *   );
 * }
 * ```
 */
