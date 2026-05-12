import clsx from 'clsx';
import { Select as _Select } from '@base-ui/react/select';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

/**
 * Positions the floating select popup relative to its trigger. Pass to
 * `Select.Popup`'s `positioner` prop to customize `side`, `align`,
 * `sideOffset`, collision behavior, etc. When `positioner` is omitted,
 * `Select.Popup` uses this component with default props.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function SelectPositioner(
		{
			align = ITEM_POPUP_POSITIONER_PROPS.align,
			// Override Base UI's `true` default so the popup is placed
			// relative to the trigger rather than aligned with the
			// highlighted item. Consumers can opt back in by passing `true`.
			alignItemWithTrigger = false,
			className,
			collisionPadding = ITEM_POPUP_POSITIONER_PROPS.collisionPadding,
			sideOffset = ITEM_POPUP_POSITIONER_PROPS.sideOffset,
			...props
		},
		ref
	) {
		return (
			<_Select.Positioner
				ref={ ref }
				align={ align }
				alignItemWithTrigger={ alignItemWithTrigger }
				collisionPadding={ collisionPadding }
				sideOffset={ sideOffset }
				{ ...props }
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
