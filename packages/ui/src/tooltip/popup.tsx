import clsx from 'clsx';
import { Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import type { PopupProps } from './types';
import { unlock } from '../lock-unlock';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const Popup = forwardRef< HTMLDivElement, PopupProps >( function TooltipPopup(
	{
		align = 'center',
		side = 'bottom',
		sideOffset = 4,
		children,
		className,
		style,
		...props
	},
	ref
) {
	return (
		<Tooltip.Portal>
			<Tooltip.Positioner
				align={ align }
				side={ side }
				sideOffset={ sideOffset }
				style={ style }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					className,
					styles.positioner
				) }
			>
				<ThemeProvider color={ { bg: '#1e1e1e' } }>
					<Tooltip.Popup
						ref={ ref }
						className={ styles.popup }
						{ ...props }
					>
						{ children }
					</Tooltip.Popup>
				</ThemeProvider>
			</Tooltip.Positioner>
		</Tooltip.Portal>
	);
} );

export { Popup };
