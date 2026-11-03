import clsx from 'clsx';
import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * Used to apply custom positioning to `Tooltip`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function TooltipPositioner(
		{ align = 'center', className, side = 'top', sideOffset = 4, ...props },
		ref
	) {
		return (
			<_Tooltip.Positioner
				ref={ ref }
				align={ align }
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
