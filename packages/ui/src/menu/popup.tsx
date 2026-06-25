import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { ThemeProvider } from '@wordpress/theme';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
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
					className={ clsx(
						itemPopupStyles.list,
						itemPopupStyles[ 'list-scrollable-container' ],
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
