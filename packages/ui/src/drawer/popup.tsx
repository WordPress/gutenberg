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
import { useOverlayScrollStateAttributes } from '../utils/use-overlay-scroll-state-attributes';
import { renderPortalWithChildren } from '../utils/render-portal-with-children';
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
 * When `portal` is omitted, defaults to `Drawer.Portal`. Portal merging is
 * handled by `renderPortalWithChildren` (shared with other overlay `Popup`s).
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DrawerPopup(
	{
		className,
		portal,
		children,
		size,
		initialFocus,
		finalFocus,
		onScroll: onScrollProp,
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttribute: CLOSE_ICON_ATTR,
	} );
	/*
	 * Scroll ownership lives on `_Drawer.Content`, not `_Drawer.Popup`:
	 * the content element carries the inner padding and safe-area insets,
	 * so hosting the scroll there lets the shared overlay-chrome CSS
	 * target a single element for sticky-chrome yield/reclaim and
	 * separator coloring. Base UI's swipe-dismiss-on-scroll-edge logic
	 * auto-discovers the scrollable element from the touch target's
	 * ancestors, so this move is transparent to it.
	 */
	const { ref: scrollStateRef, onScroll } =
		useOverlayScrollStateAttributes< HTMLDivElement >( onScrollProp );
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
					>
						<_Drawer.Content
							ref={ scrollStateRef }
							className={ styles.content }
							onScroll={ onScroll }
						>
							<DrawerValidationProvider>
								{ children }
							</DrawerValidationProvider>
						</_Drawer.Content>
					</_Drawer.Popup>
				</ThemeProvider>
			</_Drawer.Viewport>
		</>
	);

	return renderPortalWithChildren( portal, <Portal />, portalChildren );
} );

export { Popup };
