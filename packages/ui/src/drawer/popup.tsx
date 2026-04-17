import { Drawer as _Drawer } from '@base-ui/react/drawer';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { DrawerValidationProvider, useDrawerModal } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ICON_ATTR = 'data-wp-ui-drawer-close-icon';

/**
 * Renders the drawer popup element that contains the drawer content.
 * Uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DrawerPopup(
	{
		className,
		children,
		container,
		size,
		initialFocus,
		finalFocus,
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttribute: CLOSE_ICON_ATTR,
	} );
	const mergedRef = useMergeRefs( [ ref, popupRef ] );
	const modal = useDrawerModal();

	return (
		<_Drawer.Portal container={ container }>
			{ /*
			 * Only render a backdrop for fully modal drawers. Non-modal drawers
			 * should not dim the page, and `trap-focus` keeps outside pointer
			 * interactions enabled, so a backdrop would misrepresent that mode.
			 */ }
			{ modal === true && (
				<_Drawer.Backdrop className={ styles.backdrop } />
			) }
			<_Drawer.Viewport className={ styles.viewport }>
				{ /*
				 * ThemeProvider wraps _Drawer.Popup directly (matching Dialog
				 * and Popover) so the `display: contents` focus-trap workaround
				 * selector in the CSS module actually targets this subtree.
				 */ }
				<ThemeProvider>
					<_Drawer.Popup
						ref={ mergedRef }
						className={ ( state ) => {
							const isVertical =
								state.swipeDirection === 'up' ||
								state.swipeDirection === 'down';
							const resolvedSize =
								size ?? ( isVertical ? 'auto' : 'medium' );

							return clsx(
								styles.popup,
								styles[ `is-${ resolvedSize }` ],
								className
							);
						} }
						initialFocus={ resolvedInitialFocus }
						finalFocus={ finalFocus }
						{ ...props }
					>
						<_Drawer.Content className={ styles.content }>
							<DrawerValidationProvider>
								{ children }
							</DrawerValidationProvider>
						</_Drawer.Content>
					</_Drawer.Popup>
				</ThemeProvider>
			</_Drawer.Viewport>
		</_Drawer.Portal>
	);
} );

export { Popup };
