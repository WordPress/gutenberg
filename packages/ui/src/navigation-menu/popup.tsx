import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import { useDirection } from '@base-ui/react/direction-provider';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { ThemeProvider } from '../utils/theme-provider';
import { useNavigationMenuContext } from './context';
import { Portal } from './portal';
import { Positioner } from './positioner';
import styles from './style.module.scss';
import type { PopupProps } from './types';

/**
 * Renders the active navigation flyout with shared popup chrome.
 */
const Popup = forwardRef< HTMLElement, PopupProps >(
	function NavigationMenuPopup(
		{
			backdrop = false,
			children,
			className,
			portal,
			positioner,
			render,
			...props
		},
		ref
	) {
		const { depth } = useNavigationMenuContext();
		const direction = useDirection();
		const backdropElement = backdrop || null;
		const popupContent = (
			<ThemeProvider>
				<_NavigationMenu.Popup
					ref={ ref }
					render={ render ?? <div /> }
					dir={ direction }
					className={ clsx(
						styles.surface,
						depth > 0
							? styles[ 'nested-motion' ]
							: styles[ 'root-motion' ],
						styles.popup,
						className
					) }
					{ ...props }
				>
					{ children }
				</_NavigationMenu.Popup>
			</ThemeProvider>
		);
		const positionedPopup = renderSlotWithChildren(
			positioner,
			<Positioner />,
			popupContent
		);

		return renderSlotWithChildren(
			portal,
			<Portal />,
			<>
				{ backdropElement }
				{ positionedPopup }
			</>
		);
	}
);

export { Popup };
