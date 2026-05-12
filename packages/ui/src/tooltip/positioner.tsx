import clsx from 'clsx';
import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * Positions the floating tooltip content relative to the trigger. Pass to
 * `Tooltip.Popup`'s `positioner` prop to customize `side`, `align`,
 * `sideOffset`, collision behavior, etc. When `positioner` is omitted,
 * `Tooltip.Popup` uses this component with default props.
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
