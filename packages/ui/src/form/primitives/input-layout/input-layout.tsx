import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import type { InputLayoutProps } from './types';
import { SlotContextProvider } from './context';

/**
 * A low-level component that handles the visual layout of an input-like field,
 * including disabled states and standard prefix/suffix slots.
 */
export const InputLayout = forwardRef< HTMLDivElement, InputLayoutProps >(
	function InputLayout(
		{
			className,
			children,
			visuallyDisabled,
			size = 'default',
			isBorderless,
			prefix,
			suffix,
			...restProps
		},
		ref
	) {
		return (
			<div
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles[ 'input-layout' ],
					styles[ `is-size-${ size }` ],
					visuallyDisabled && styles[ 'is-disabled' ],
					isBorderless && styles[ 'is-borderless' ],
					className
				) }
				{ ...restProps }
			>
				<SlotContextProvider type="prefix">
					{ prefix }
				</SlotContextProvider>
				{ children }
				<SlotContextProvider type="suffix">
					{ suffix }
				</SlotContextProvider>
			</div>
		);
	}
);
