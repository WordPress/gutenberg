import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
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
		<_Menu.Popup
			ref={ ref }
			className={ clsx(
				styles.popup,
				isSubmenu ? styles[ 'is-submenu' ] : styles[ 'is-root' ],
				className
			) }
			{ ...props }
		>
			<div
				/*
				 * `styles.list` provides the alignment scope for items
				 * that are not inside an explicit Menu.Group.
				 */
				className={ styles.list }
			>
				{ children }
			</div>
		</_Menu.Popup>
	);

	const positionedPopup = renderSlotWithChildren(
		positioner,
		<Positioner />,
		popupContent
	);

	return renderSlotWithChildren( portal, <Portal />, positionedPopup );
} );

export { Popup };
