import clsx from 'clsx';
import { Menu as _Menu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import type { CSSProperties } from 'react';
import { ITEM_POPUP_POSITIONER_PROPS } from '../form/primitives/constants';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { useMenuContext } from './context';
import type { PositionerProps } from './types';

const MENU_POPUP_PADDING = 4;
const MENU_POPUP_BORDER_WIDTH = 1;

const MENU_SUBMENU_POPUP_POSITIONER_PROPS = {
	side: 'inline-end',
	align: 'start',
	sideOffset: -4,
	collisionPadding: 12,
	alignOffset: ( { side, align } ) => {
		if ( side === 'top' || side === 'bottom' || align !== 'start' ) {
			return 0;
		}

		return -( MENU_POPUP_PADDING + MENU_POPUP_BORDER_WIDTH );
	},
} as const satisfies PositionerProps;

/**
 * Used to apply custom positioning to `Menu`'s floating content.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function MenuPositioner( { className, style, ...props }, ref ) {
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
				style={
					{
						'--_wp-ui-menu-popup-padding': `${ MENU_POPUP_PADDING }px`,
						'--_wp-ui-menu-popup-border-width': `${ MENU_POPUP_BORDER_WIDTH }px`,
						...style,
					} as CSSProperties
				}
			/>
		);
	}
);

export { Positioner };
