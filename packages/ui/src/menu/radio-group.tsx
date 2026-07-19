import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import type { RadioGroupProps } from './types';

/**
 * Groups related radio menu items.
 */
const RadioGroup = forwardRef< HTMLDivElement, RadioGroupProps >(
	function MenuRadioGroup( { className, ...props }, ref ) {
		return (
			<_Menu.RadioGroup
				ref={ ref }
				className={ clsx(
					itemLayoutStyles[ 'layout-transparent' ],
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { RadioGroup };
