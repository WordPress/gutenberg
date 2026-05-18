import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../../lock-unlock';
import { Portal } from './portal';
import { Positioner } from './positioner';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { ComboboxPopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

export const Popup = forwardRef< HTMLDivElement, ComboboxPopupProps >(
	function Popup( { className, portal, positioner, ...restProps }, ref ) {
		const popupContent = (
			<ThemeProvider>
				<_Combobox.Popup
					ref={ ref }
					className={ clsx( itemPopupStyles.popup, className ) }
					{ ...restProps }
				/>
			</ThemeProvider>
		);

		const positionedPopup = renderSlotWithChildren(
			positioner,
			<Positioner />,
			popupContent
		);

		return renderSlotWithChildren( portal, <Portal />, positionedPopup );
	}
);
