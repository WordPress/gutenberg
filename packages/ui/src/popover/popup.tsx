import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';
import resetStyles from '../utils/css/resets.module.css';
import dropdownMotionStyles from '../utils/css/dropdown-motion.module.css';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

/**
 * Renders the popover popup element that contains the popover content.
 * Uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function PopoverPopup(
	{
		align = 'center',
		side = 'bottom',
		sideOffset = 4,
		alignOffset,
		children,
		className,
		style,
		...props
	},
	ref
) {
	return (
		<_Popover.Portal>
			<_Popover.Positioner
				align={ align }
				side={ side }
				sideOffset={ sideOffset }
				alignOffset={ alignOffset }
				style={ style }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					dropdownMotionStyles[ 'dropdown-motion' ],
					styles.positioner,
					className
				) }
			>
				<ThemeProvider>
					<_Popover.Popup
						ref={ ref }
						className={ styles.popup }
						{ ...props }
					>
						{ children }
					</_Popover.Popup>
				</ThemeProvider>
			</_Popover.Positioner>
		</_Popover.Portal>
	);
} );

export { Popup };
