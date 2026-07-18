import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import {
	MENU_POPUP_POSITIONER_PROPS,
	MENU_SUBMENU_POPUP_POSITIONER_PROPS,
} from '../form/primitives/constants';
import popupStyles from '../utils/css/dropdown-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { useMenuContext } from './context';
import type { PositionerProps } from './types';

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner(
		{ className, side, align, sideOffset, collisionPadding, ...props },
		ref
	) {
		const { isSubmenu } = useMenuContext();
		const defaultProps = isSubmenu
			? MENU_SUBMENU_POPUP_POSITIONER_PROPS
			: MENU_POPUP_POSITIONER_PROPS;

		return (
			<_Menu.Positioner
				side={ side ?? defaultProps.side }
				align={ align ?? defaultProps.align }
				sideOffset={ sideOffset ?? defaultProps.sideOffset }
				collisionPadding={
					collisionPadding ?? defaultProps.collisionPadding
				}
				{ ...props }
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					popupStyles.positioner,
					styles.positioner,
					className
				) }
			/>
		);
	}
);

export { Positioner };
