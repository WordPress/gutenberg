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
import { SCROLL_CONTAINER_ATTR } from '../utils/use-overlay-scroll-state-attributes';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import { DrawerValidationProvider, useDrawerModal } from './context';
import { Portal } from './portal';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ICON_ATTR = 'data-wp-ui-drawer-close-icon';

/**
 * Renders the drawer popup element that contains the drawer content.
 * Uses a portal to render outside the DOM hierarchy.
 *
 * When `portal` is omitted, defaults to `Drawer.Portal`.
 *
 * The popup is a flex column; scroll ownership lives on `Drawer.Content`,
 * which children are expected to render. Without it, long body content will
 * clip instead of scrolling and Base UI's swipe-dismiss-on-scroll-edge
 * logic on up/down drawers cannot engage.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DrawerPopup(
	{ className, portal, children, size, initialFocus, finalFocus, ...props },
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttributes: [ CLOSE_ICON_ATTR, SCROLL_CONTAINER_ATTR ],
	} );
	const mergedRef = useMergeRefs( [ ref, popupRef ] );
	const modal = useDrawerModal();

	const portalChildren = (
		<>
			{ /*
			 * Only render a backdrop for fully modal drawers. Non-modal drawers
			 * should not dim the page, and `trap-focus` keeps outside pointer
			 * interactions enabled, so a backdrop would misrepresent that mode.
			 */ }
			{ modal === true && (
				<_Drawer.Backdrop
					className={ styles.backdrop }
					data-testid="drawer-backdrop"
				/>
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
								className,
								styles[ `is-${ resolvedSize }` ]
							);
						} }
						initialFocus={ resolvedInitialFocus }
						finalFocus={ finalFocus }
						{ ...props }
						data-wp-ui-overlay-modal={
							modal === true ? '' : undefined
						}
					>
						<DrawerValidationProvider>
							{ children }
						</DrawerValidationProvider>
					</_Drawer.Popup>
				</ThemeProvider>
			</_Drawer.Viewport>
		</>
	);

	return renderSlotWithChildren( portal, <Portal />, portalChildren );
} );

export { Popup };
