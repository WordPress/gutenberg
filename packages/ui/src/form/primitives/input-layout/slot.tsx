import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { InputLayoutSlotProps } from './types';

/**
 * A layout helper to add paddings in a prefix or suffix.
 */
export const InputLayoutSlot = forwardRef<
	HTMLDivElement,
	InputLayoutSlotProps
>( function InputLayoutSlot(
	{ padding = 'default', className, ...restProps },
	ref
) {
	return (
		<div
			ref={ ref }
			className={ clsx(
				styles[ 'input-layout-slot' ],
				styles[ `is-padding-${ padding }` ],
				className
			) }
			{ ...restProps }
		/>
	);
} );

InputLayoutSlot.displayName = 'InputLayout.Slot';
