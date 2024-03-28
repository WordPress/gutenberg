/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import type { ToggleGroupControlOptionProps as ToggleGroupControlOptionBaseProps } from '../types';
import { ToggleGroupControlOptionBase } from '../toggle-group-control-option-base';

export type ToggleGroupControlOptionProps = WordPressComponentProps<
	ToggleGroupControlOptionBaseProps,
	'button',
	false
>;

function UnforwardedToggleGroupControlOption(
	props: ToggleGroupControlOptionProps,
	ref: ForwardedRef< any >
) {
	const { label, ...restProps } = props;
	const optionLabel = restProps[ 'aria-label' ] || label;
	return (
		<ToggleGroupControlOptionBase
			{ ...restProps }
			aria-label={ optionLabel }
			ref={ ref }
		>
			{ label }
		</ToggleGroupControlOptionBase>
	);
}

/**
 * `ToggleGroupControlOption` is a form component and is meant to be used as a
 * child of `ToggleGroupControl`.
 *
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
export const ToggleGroupControlOption = forwardRef(
	UnforwardedToggleGroupControlOption
);

export default ToggleGroupControlOption;
