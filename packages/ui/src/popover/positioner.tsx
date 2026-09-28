import clsx from 'clsx';
import { Popover as _Popover } from '@base-ui/react/popover';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * Used to apply custom positioning to `Popover`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function PopoverPositioner(
		{
			align = 'center',
			// Matches the popup's border-radius (--wpds-border-radius-md).
			arrowPadding = 8,
			className,
			side = 'bottom',
			sideOffset = 8,
			...props
		},
		ref
	) {
		return (
			<_Popover.Positioner
				ref={ ref }
				align={ align }
				arrowPadding={ arrowPadding }
				side={ side }
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
