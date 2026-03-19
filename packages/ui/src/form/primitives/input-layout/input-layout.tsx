import clsx from 'clsx';
import { Children, forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import type { InputLayoutProps } from './types';

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
				{ Children.count( prefix ) > 0 && (
					<div
						className={ styles[ 'slot-wrapper' ] }
						data-slot-type="prefix"
					>
						{ prefix }
					</div>
				) }
				{ children }
				{ Children.count( suffix ) > 0 && (
					<div
						className={ styles[ 'slot-wrapper' ] }
						data-slot-type="suffix"
					>
						{ suffix }
					</div>
				) }
			</div>
		);
	}
);
