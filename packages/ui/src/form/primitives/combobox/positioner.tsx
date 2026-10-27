import clsx from 'clsx';
import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

/**
 * Used to apply custom positioning to `Combobox`'s popup content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function ComboboxPositioner( { className, ...props }, ref ) {
		return (
			<_Combobox.Positioner
				{ ...ITEM_POPUP_POSITIONER_PROPS }
				{ ...props }
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner,
					className
				) }
			/>
		);
	}
);

export { Positioner };
