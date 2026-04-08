import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
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
 * Renders the floating popup container for the popover content.
 *
 * Handles portal rendering, positioning relative to the anchor, collision
 * avoidance, focus management, and optional backdrop. Supply a `container`
 * element for cross-document scenarios such as iframes.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function PopoverPopup(
	{
		align = 'center',
		alignOffset,
		anchor,
		// Matches the popup's border-radius (--wpds-border-radius-md).
		arrowPadding = 8,
		backdrop = false,
		children,
		className,
		collisionAvoidance,
		collisionBoundary,
		collisionPadding,
		container,
		finalFocus,
		initialFocus,
		side = 'bottom',
		sideOffset = 8,
		sticky,
		style,
		variant = 'default',
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
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
			arrowPadding={ arrowPadding }
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

	return (
		<_Popover.Portal container={ container }>
			{ backdropElement }
			{ positioner }
		</_Popover.Portal>
	);
} );

export { Popup };
