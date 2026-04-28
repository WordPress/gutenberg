import clsx from 'clsx';
import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import type { PopupProps } from './types';
import { unlock } from '../lock-unlock';
import { Portal } from './portal';
import { renderPortalWithChildren } from '../utils/render-portal-with-children';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const Popup = forwardRef< HTMLDivElement, PopupProps >( function TooltipPopup(
	{
		align = 'center',
		portal,
		side = 'top',
		sideOffset = 4,
		children,
		className,
		...props
	},
	ref
) {
	const portalChildren = (
		<_Tooltip.Positioner
			align={ align }
			side={ side }
			sideOffset={ sideOffset }
			className={ clsx( resetStyles[ 'box-sizing' ], styles.positioner ) }
		>
			{ /* This should ideally use whatever dark color makes sense,
				and not be hardcoded to #1e1e1e. The solutions would be to:
				  - review the design of the tooltip, in case we want to stop
				    hardcoding it to a dark background
				  - create new semantic tokens as needed (aliasing either the "inverted
					  bg" or "perma-dark bg" private tokens) and have Tooltip.Popup use
				    them;
				  - remove the hardcoded `bg` setting from the `ThemeProvider` below
					*/ }
			<ThemeProvider color={ { bg: '#1e1e1e' } }>
				<_Tooltip.Popup
					ref={ ref }
					className={ clsx( styles.popup, className ) }
					{ ...props }
				>
					{ children }
				</_Tooltip.Popup>
			</ThemeProvider>
		</_Tooltip.Positioner>
	);

	return renderPortalWithChildren( portal, <Portal />, portalChildren );
} );

export { Popup };
