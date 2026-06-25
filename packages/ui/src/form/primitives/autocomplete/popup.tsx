import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { ThemeProvider } from '@wordpress/theme';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { Portal } from './portal';
import { Positioner } from './positioner';
import type { AutocompletePopupProps } from './types';

export const Popup = forwardRef< HTMLDivElement, AutocompletePopupProps >(
	function Popup( { className, portal, positioner, ...restProps }, ref ) {
		const popupContent = (
			<ThemeProvider>
				<_Autocomplete.Popup
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
