import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import { ITEM_POPUP_POSITIONER_PROPS } from '../form/primitives/constants';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { useMenuContext } from './context';
import type { PositionerProps } from './types';

const MENU_SUBMENU_POPUP_POSITIONER_PROPS = {
	side: 'inline-end',
	align: 'start',
	sideOffset: -4,
	collisionPadding: 12,
} as const;

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner( { className, ...props }, ref ) {
		const { isSubmenu } = useMenuContext();
		const defaultProps = isSubmenu
			? MENU_SUBMENU_POPUP_POSITIONER_PROPS
			: ITEM_POPUP_POSITIONER_PROPS;

		return (
			<_Menu.Positioner
				{ ...defaultProps }
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
