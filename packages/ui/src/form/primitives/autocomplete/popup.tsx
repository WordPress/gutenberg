import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { getItemPopupWidthClassName } from '../../../utils/css/item-popup';
import { AutocompletePopupContext } from './context';
import { Portal } from './portal';
import { Positioner } from './positioner';
import type { AutocompletePopupProps } from './types';

/**
 * The suggestion list for an `Autocomplete.Input` rendered outside it.
 *
 * Do not render `Autocomplete.Input` inside `Autocomplete.Popup`. For a
 * searchable picker that opens from a button, render
 * `<Autocomplete.Root inline open>` inside a `Popover.Popup` instead.
 */
export const Popup = forwardRef< HTMLDivElement, AutocompletePopupProps >(
	function UnforwardedPopup(
		{ className, portal, positioner, width, ...restProps },
		ref
	) {
		const popupContent = (
			<AutocompletePopupContext.Provider value>
				<_Autocomplete.Popup
					ref={ ref }
					className={ clsx(
						itemPopupStyles.popup,
						itemPopupStyles[ 'fixed-width-presets' ],
						getItemPopupWidthClassName( width ),
						className
					) }
					{ ...restProps }
				/>
			</AutocompletePopupContext.Provider>
		);

		const positionedPopup = renderSlotWithChildren(
			positioner,
			<Positioner />,
			popupContent
		);

		return renderSlotWithChildren( portal, <Portal />, positionedPopup );
	}
);
