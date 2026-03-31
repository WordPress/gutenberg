import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';
import resetStyles from '../utils/css/resets.module.css';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { PopoverValidationProvider } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ATTR = 'data-wp-ui-popover-close';

/**
 * Renders the popover popup element that contains the popover content.
 * By default, uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function PopoverPopup(
	{
		align = 'center',
		alignOffset,
		anchor,
		backdrop = false,
		children,
		className,
		collisionAvoidance,
		collisionBoundary,
		collisionPadding,
		container,
		finalFocus,
		initialFocus,
		inline: inlineProp = false,
		side = 'bottom',
		sideOffset = 4,
		sticky,
		style,
		variant = 'default',
		...props
	},
	ref
) {
	const inlineContainerRef = useRef< HTMLSpanElement >( null );
	const { resolvedInitialFocus, popupRef } =
		useDeprioritizedInitialFocus( {
			initialFocus,
			deprioritizedAttribute: CLOSE_ATTR,
		} );
	const mergedPopupRef = useMergeRefs( [ ref, popupRef ] );

	const backdropElement = backdrop ? (
		<_Popover.Backdrop className={ styles.backdrop } />
	) : null;

	const positioner = (
		<_Popover.Positioner
			align={ align }
			alignOffset={ alignOffset }
			anchor={ anchor }
			collisionAvoidance={ collisionAvoidance }
			collisionBoundary={ collisionBoundary }
			collisionPadding={ collisionPadding }
			side={ side }
			sideOffset={ sideOffset }
			sticky={ sticky }
			style={ style }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				styles.positioner,
				className
			) }
		>
			<ThemeProvider>
				<_Popover.Popup
					ref={ mergedPopupRef }
					initialFocus={ resolvedInitialFocus }
					finalFocus={ finalFocus }
					className={ clsx( variant !== 'unstyled' && styles.popup ) }
					{ ...props }
				>
					<PopoverValidationProvider>
						{ children }
					</PopoverValidationProvider>
				</_Popover.Popup>
			</ThemeProvider>
		</_Popover.Positioner>
	);

	if ( inlineProp ) {
		return (
			<>
				<span
					ref={ inlineContainerRef }
					style={ { display: 'contents' } }
				/>
				<_Popover.Portal container={ inlineContainerRef }>
					{ backdropElement }
					{ positioner }
				</_Popover.Portal>
			</>
		);
	}

	return (
		<_Popover.Portal container={ container }>
			{ backdropElement }
			{ positioner }
		</_Popover.Portal>
	);
} );

export { Popup };
