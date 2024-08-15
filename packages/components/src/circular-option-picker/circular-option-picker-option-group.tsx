/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import type { OptionGroupProps } from './types';

export function OptionGroup( {
	className,
	options,
	...additionalProps
}: OptionGroupProps ) {
	const role =
		'aria-label' in additionalProps || 'aria-labelledby' in additionalProps
			? 'group'
			: undefined;

	return (
		<div
			{ ...additionalProps }
			role={ role }
			className={ clsx(
				'components-circular-option-picker__option-group',
				'components-circular-option-picker__swatches',
				className
			) }
		>
			{ options }
		</div>
	);
}
