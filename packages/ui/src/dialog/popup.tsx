import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { forwardRef, useMemo, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { tabbable } from 'tabbable';
import { unlock } from '../lock-unlock';
import { DialogValidationProvider } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

/**
 * Options matching Base UI's internal tabbable configuration.
 * @see https://github.com/mui/base-ui FloatingFocusManager utils/tabbable.ts
 */
const getTabbableOptions = () => ( {
	getShadowRoot: true,
	displayCheck:
		typeof ResizeObserver === 'function' &&
		ResizeObserver.toString().includes( '[native code]' )
			? ( 'full' as const )
			: ( 'none' as const ),
} );

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
		...props
	},
	ref
) {
	const popupRef = useRef< HTMLDivElement >( null );
	const mergedRef = useMergeRefs( [ ref, popupRef ] );

	const resolvedInitialFocus = useMemo( () => {
		if ( initialFocus !== undefined && initialFocus !== true ) {
			return initialFocus;
		}
		return ( interactionType: string ): HTMLElement | boolean | null => {
			if ( interactionType === 'touch' ) {
				return popupRef.current ?? true;
			}
			const popup = popupRef.current;
			if ( popup ) {
				const tabbables = tabbable( popup, getTabbableOptions() );
				for ( const el of tabbables ) {
					if (
						el instanceof HTMLElement &&
						! el.hasAttribute( CLOSE_ICON_ATTR )
					) {
						return el;
					}
				}
			}
			return true;
		};
	}, [ initialFocus ] );

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
				>
					<DialogValidationProvider>
						{ children }
					</DialogValidationProvider>
				</_Dialog.Popup>
			</ThemeProvider>
		</_Dialog.Portal>
	);
} );

export { Popup };
