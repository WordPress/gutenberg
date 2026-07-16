import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { ThemeProvider } from '../utils/theme-provider';
import styles from './style.module.css';
import { Portal } from './portal';
import { Positioner } from './positioner';
import { useMenuContext } from './context';
import type { PopupProps } from './types';

/**
 * Renders the floating menu popup.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function MenuPopup(
	{ children, className, portal, positioner, ...props },
	ref
) {
	const { isSubmenu } = useMenuContext();

	const popupContent = (
		<ThemeProvider>
			<_Menu.Popup
				ref={ ref }
				className={ clsx(
					styles.popup,
					isSubmenu
						? styles[ 'popup--submenu' ]
						: styles[ 'popup--root' ],
					className
				) }
				{ ...props }
			>
				<div
					/*
					 * `styles.list` flattens this wrapper so menu items can
					 * participate in the popup's shared grid.
					 */
					className={ styles.list }
				>
					{ children }
				</div>
			</_Menu.Popup>
		</ThemeProvider>
	);

	const positionedPopup = renderSlotWithChildren(
		positioner,
		<Positioner />,
		popupContent
	);

	return renderSlotWithChildren( portal, <Portal />, positionedPopup );
} );

export { Popup };
