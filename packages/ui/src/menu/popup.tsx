import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { ThemeProvider } from '../utils/theme-provider';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import styles from './style.module.css';
import { Portal } from './portal';
import { Positioner } from './positioner';
import type { PopupProps } from './types';

/**
 * Renders the floating menu popup.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function MenuPopup(
	{ children, className, portal, positioner, ...props },
	ref
) {
	const popupContent = (
		<ThemeProvider>
			<_Menu.Popup
				ref={ ref }
				className={ clsx(
					itemPopupStyles.popup,
					styles.popup,
					className
				) }
				{ ...props }
			>
				<div
					/*
					 * `styles.list` flattens this wrapper so menu items can
					 * participate in the popup's shared grid. Use only the
					 * shared typography utility here because the default
					 * item-popup list layout would conflict with that grid.
					 */
					className={ clsx(
						itemPopupStyles[ 'list-typography' ],
						styles.list
					) }
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
