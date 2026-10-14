import clsx from 'clsx';
import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../../../utils/css/resets.module.css';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import styles from './style.module.css';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

/**
 * Used to apply custom positioning to `Select`'s listbox content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function SelectPositioner(
		{ className, alignItemWithTrigger = true, ...props },
		ref
	) {
		return (
			<_Select.Positioner
				{ ...ITEM_POPUP_POSITIONER_PROPS }
				{ ...props }
				alignItemWithTrigger={ alignItemWithTrigger }
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner,
					alignItemWithTrigger &&
						itemPopupStyles[ 'is-align-item-with-trigger' ],
					className
				) }
			/>
		);
	}
);

export { Positioner };
