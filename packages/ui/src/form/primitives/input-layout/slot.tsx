import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { InputLayoutSlotProps } from './types';
import { useInputLayoutSlotContext } from './context';

/**
 * A layout helper to add paddings in a prefix or suffix.
 */
export const InputLayoutSlot = forwardRef<
	HTMLDivElement,
	InputLayoutSlotProps
>( function InputLayoutSlot(
	{ type: typeProp, padding = 'default', ...restProps },
	ref
) {
	const typeContext = useInputLayoutSlotContext();
	const type = typeProp ?? typeContext;

	if ( ! type ) {
		throw new Error(
			'InputLayoutSlot requires a `type` prop or must be used within an InputLayout prefix/suffix slot.'
		);
	}

	return (
		<div
			ref={ ref }
			className={ clsx(
				styles[ 'input-layout-slot' ],
				styles[ `is-${ type }` ],
				styles[ `is-padding-${ padding }` ]
			) }
			{ ...restProps }
		/>
	);
} );

InputLayoutSlot.displayName = 'InputLayout.Slot';
