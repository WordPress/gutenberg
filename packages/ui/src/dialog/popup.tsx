import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import type { UIEvent } from 'react';
import {
	forwardRef,
	useCallback,
	useLayoutEffect,
	useState,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { DialogValidationProvider } from './context';
import {
	DialogScrollChromeContext,
	type DialogScrollChromeContextValue,
} from './scroll-chrome-context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

/**
 * Renders the dialog popup element that contains the dialog content.
 * Uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{
		className,
		size = 'medium',
		initialFocus,
		finalFocus,
		children,
		onScroll,
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttribute: CLOSE_ICON_ATTR,
	} );
	const mergedRef = useMergeRefs( [ ref, popupRef ] );

	const [ scrollChrome, setScrollChrome ] =
		useState< DialogScrollChromeContextValue >( {
			headerScrolledFromTop: false,
			footerHasContentBelow: false,
		} );

	const syncScrollChrome = useCallback( () => {
		const el = popupRef.current;
		if ( ! el ) {
			return;
		}
		const { scrollTop, scrollHeight, clientHeight } = el;
		setScrollChrome( {
			headerScrolledFromTop: scrollTop > 0,
			footerHasContentBelow: scrollTop + clientHeight < scrollHeight - 1,
		} );
	}, [ popupRef ] );

	useLayoutEffect( () => {
		let resizeObserver: ResizeObserver | undefined;
		const frameId = requestAnimationFrame( () => {
			const el = popupRef.current;
			if ( ! el ) {
				return;
			}
			syncScrollChrome();
			resizeObserver = new ResizeObserver( syncScrollChrome );
			resizeObserver.observe( el );
		} );
		return () => {
			cancelAnimationFrame( frameId );
			resizeObserver?.disconnect();
		};
	}, [ syncScrollChrome, popupRef ] );

	const handleScroll = useCallback(
		( event: UIEvent< HTMLDivElement > ) => {
			onScroll?.( event );
			syncScrollChrome();
		},
		[ onScroll, syncScrollChrome ]
	);

	return (
		<_Dialog.Portal>
			<_Dialog.Backdrop className={ styles.backdrop } />
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
					<DialogScrollChromeContext.Provider value={ scrollChrome }>
						<DialogValidationProvider>
							{ children }
						</DialogValidationProvider>
					</DialogScrollChromeContext.Provider>
				</_Dialog.Popup>
			</ThemeProvider>
		</_Dialog.Portal>
	);
} );

export { Popup };
