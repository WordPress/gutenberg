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
import { Positioner } from './positioner';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import styles from './style.module.css';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

/*
 * This should ideally use whatever dark color makes sense, and not be
 * hardcoded to #1e1e1e. The solutions would be to:
 *   - review the design of the tooltip, in case we want to stop hardcoding
 *     it to a dark background
 *   - create new semantic tokens as needed (aliasing either the "inverted
 *     bg" or "perma-dark bg" private tokens) and have Tooltip.Popup use them;
 *   - remove the hardcoded `background` setting altogether
 */
const POPUP_COLOR = { background: '#1e1e1e' };

const Popup = forwardRef< HTMLDivElement, PopupProps >( function TooltipPopup(
	{ portal, positioner, children, className, ...props },
	ref
) {
	const popupContent = (
		<ThemeProvider color={ POPUP_COLOR }>
			<_Tooltip.Popup
				ref={ ref }
				className={ clsx( styles.popup, className ) }
				{ ...props }
			>
				{ children }
			</_Tooltip.Popup>
		</ThemeProvider>
	);

	const positionedPopup = renderSlotWithChildren(
		positioner,
		<Positioner />,
		popupContent
	);

	return renderSlotWithChildren( portal, <Portal />, positionedPopup );
} );

export { Popup };
