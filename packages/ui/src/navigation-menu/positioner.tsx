import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import {
	MENU_POPUP_POSITIONER_PROPS,
	MENU_SUBMENU_POPUP_POSITIONER_PROPS,
} from '../form/primitives/constants';
import popupStyles from '../utils/css/dropdown-popup.module.css';
import resetStyles from '../utils/css/resets.module.css';
import { useNavigationMenuContext } from './context';
import styles from './style.module.css';
import type { PositionerProps } from './types';

/**
 * Positions a flyout against its active Trigger.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function NavigationMenuPositioner(
		{ align, className, collisionPadding, side, sideOffset, ...props },
		ref
	) {
		const { depth } = useNavigationMenuContext();
		const defaultProps =
			depth > 0
				? MENU_SUBMENU_POPUP_POSITIONER_PROPS
				: MENU_POPUP_POSITIONER_PROPS;

		return (
			<_NavigationMenu.Positioner
				align={ align ?? defaultProps.align }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					popupStyles.positioner,
					styles.positioner,
					className
				) }
				collisionPadding={
					collisionPadding ?? defaultProps.collisionPadding
				}
				ref={ ref }
				side={ side ?? defaultProps.side }
				sideOffset={ sideOffset ?? defaultProps.sideOffset }
				{ ...props }
			/>
		);
	}
);

export { Positioner };
