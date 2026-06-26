import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import { ITEM_POPUP_POSITIONER_PROPS } from '../form/primitives/constants';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { PositionerProps } from './types';

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner(
		{
			className,
			sideOffset = ITEM_POPUP_POSITIONER_PROPS.sideOffset,
			collisionPadding = ITEM_POPUP_POSITIONER_PROPS.collisionPadding,
			...props
		},
		ref
	) {
		return (
			<_Menu.Positioner
				sideOffset={ sideOffset }
				collisionPadding={ collisionPadding }
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
