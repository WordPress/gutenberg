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
import { ToggleGroupControlOptionIcon } from '../../toggle-group-control';
import type { ToggleMultipleGroupControlOptionIconProps } from '../types';
import type { WordPressComponentProps } from '../../ui/context';

function UnforwardedToggleMultipleGroupControlOptionIcon(
	{
		isPressed,
		...otherProps
	}: WordPressComponentProps<
		ToggleMultipleGroupControlOptionIconProps,
		'button',
		false
	>,
	ref: ForwardedRef< any >
) {
	return (
		<ToggleGroupControlOptionIcon
			{ ...otherProps }
			ref={ ref }
			aria-pressed={ isPressed }
		/>
	);
}

/**
 * `ToggleMultipleGroupControlOptionIcon` is a form component which is meant to be used
 * as a child of `ToggleMultipleGroupControl` and displays an icon.
 */
export const ToggleMultipleGroupControlOptionIcon = forwardRef(
	UnforwardedToggleMultipleGroupControlOptionIcon
);
