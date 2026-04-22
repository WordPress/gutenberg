import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import type { UIEvent } from 'react';
import { forwardRef, useCallback, useLayoutEffect } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { renderPortalWithChildren } from '../utils/render-portal-with-children';
import { DialogValidationProvider, useDialogModal } from './context';
import { Portal } from './portal';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

/*
 * Data attributes that advertise the popup's scroll state to CSS. Sticky
 * header/footer chrome uses descendant selectors against these attributes to
 * toggle its separator border without forcing a React re-render on every
 * scroll frame.
 *
 * Once CSS scroll-state container queries are supported across target
 * browsers, both attributes and the `onScroll` / `ResizeObserver` plumbing
 * below can be removed in favor of
 * `@container scroll-state(scrollable: top)` / `(scrollable: bottom)`.
 * See: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries
 */
const SCROLLED_FROM_TOP_ATTR = 'data-wp-ui-dialog-scrolled-from-top';
const SCROLLED_FROM_BOTTOM_ATTR = 'data-wp-ui-dialog-scrolled-from-bottom';

/**
 * Allow fractional-pixel rounding when comparing scroll offsets. Browsers can
 * report `scrollTop + clientHeight` as slightly less than `scrollHeight` even
 * when fully scrolled to the bottom.
 */
const SCROLL_END_EPSILON = 1;

function updateScrollAttributes( el: HTMLElement ) {
	const { scrollTop, clientHeight, scrollHeight } = el;
	el.toggleAttribute( SCROLLED_FROM_TOP_ATTR, scrollTop > 0 );
	el.toggleAttribute(
		SCROLLED_FROM_BOTTOM_ATTR,
		scrollTop + clientHeight < scrollHeight - SCROLL_END_EPSILON
	);
}

/**
 * Renders the dialog popup element that contains the dialog content.
 * Uses a portal to render outside the DOM hierarchy.
 *
 * When `portal` is omitted, defaults to `Dialog.Portal`. Portal merging is
 * handled by `renderPortalWithChildren` (shared with other overlay `Popup`s).
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{
		className,
		portal,
		children,
		size = 'medium',
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
	const modal = useDialogModal();

	const handleScroll = useCallback( ( event: UIEvent< HTMLDivElement > ) => {
		updateScrollAttributes( event.currentTarget );
	}, [] );

	// Initialize the scroll-state data attributes and keep them in sync when
	// the popup or its content resizes (viewport resize, size preset change,
	// content height changes that don't resize the popup because of max-height).
	useLayoutEffect( () => {
		const el = popupRef.current;
		if ( ! el ) {
			return;
		}

		updateScrollAttributes( el );

		const observer = new ResizeObserver( () => {
			if ( popupRef.current ) {
				updateScrollAttributes( popupRef.current );
			}
		} );
		observer.observe( el );
		for ( const child of Array.from( el.children ) ) {
			observer.observe( child );
		}

		return () => observer.disconnect();
		// `popupRef` is a stable ref; listed to satisfy exhaustive-deps.
	}, [ popupRef ] );

	const portalChildren = (
		<>
			{ /*
			 * Only render a backdrop for fully modal dialogs. Non-modal dialogs
			 * should not dim the page, and `trap-focus` keeps outside pointer
			 * interactions enabled, so a backdrop would misrepresent that mode.
			 */ }
			{ modal === true && (
				<_Dialog.Backdrop
					className={ styles.backdrop }
					data-testid="dialog-backdrop"
				/>
			) }
			<ThemeProvider>
				<_Dialog.Popup
					ref={ mergedRef }
					className={ clsx(
						styles.popup,
						className,
						styles[ `is-${ size }` ]
					) }
					initialFocus={ resolvedInitialFocus }
					finalFocus={ finalFocus }
					{ ...props }
					onScroll={ handleScroll }
				>
					<DialogValidationProvider>
						{ children }
					</DialogValidationProvider>
				</_Dialog.Popup>
			</ThemeProvider>
		</>
	);

	return renderPortalWithChildren( portal, <Portal />, portalChildren );
} );

export { Popup };
