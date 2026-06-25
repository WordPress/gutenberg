import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { PositionerProps } from './types';

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner(
		{
			align = 'start',
			className,
			side = 'bottom',
			sideOffset = 8,
			...props
		},
		ref
	) {
		return (
			<_Menu.Positioner
				align={ align }
				side={ side }
				sideOffset={ sideOffset }
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
