import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import popupStyles from '../utils/css/dropdown-popup.module.css';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { ThemeProvider } from '../utils/theme-provider';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
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
					popupStyles.surface,
					styles.popup,
					isSubmenu
						? popupStyles[ 'nested-motion' ]
						: popupStyles[ 'root-motion' ],
					className
				) }
				{ ...props }
			>
				<div
					/*
					 * `styles.list` provides the alignment scope for items
					 * that are not inside an explicit Menu.Group.
					 */
					className={ clsx(
						itemLayoutStyles[ 'alignment-group' ],
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
