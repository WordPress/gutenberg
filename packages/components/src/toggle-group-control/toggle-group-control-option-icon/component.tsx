/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../ui/context';
import type { ToggleGroupControlOptionIconProps } from '../types';
import { ToggleGroupControlOptionBase } from '../toggle-group-control-option-base';

export default function ToggleGroupControlOptionIcon(
	props: WordPressComponentProps<
		ToggleGroupControlOptionIconProps,
		'button',
		false
	>
) {
	const { icon, ...restProps } = props;
	return (
		<ToggleGroupControlOptionBase { ...restProps }>
			<Icon icon={ icon } />
		</ToggleGroupControlOptionBase>
	);
}

/**
 * `ToggleGroupControlOptionIcon` is a form component which is meant to be used as a
 * child of `ToggleGroupControl` and displays an icon.
 *
 * @example
 * ```jsx
 *
 * import {
 *	__experimentalToggleGroupControl as ToggleGroupControl,
 *	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
 * from '@wordpress/components';
 * import { formatLowercase, formatUppercase } from '@wordpress/icons';
 *
 * function Example() {
 *	return (
 *		<ToggleGroupControl label="my label" value="vertical" isBlock>
 *			<ToggleGroupControlOptionIcon
 *				value="uppercase"
 *				icon={ formatUppercase }
 *			/>
 *			<ToggleGroupControlOptionIcon
 *				value="lowercase"
 *				icon={ formatLowercase }
 *			/>
 *		</ToggleGroupControl>
 *	);
 * }
 ** ```
 */
