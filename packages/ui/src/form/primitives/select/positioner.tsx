import clsx from 'clsx';
import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

/**
 * Used to apply custom positioning to `Select`'s listbox content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function SelectPositioner( { className, ...props }, ref ) {
		return (
			<_Select.Positioner
				{ ...ITEM_POPUP_POSITIONER_PROPS }
				// Override Base UI's `true` default so the popup is placed
				// relative to the trigger rather than aligned with the
				// highlighted item. Consumers can opt back in by passing `true`.
				alignItemWithTrigger={ false }
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
