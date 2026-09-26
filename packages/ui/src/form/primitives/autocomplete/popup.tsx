import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { getItemPopupWidthClassName } from '../../../utils/css/item-popup';
import { Portal } from './portal';
import { Positioner } from './positioner';
import type { AutocompletePopupProps } from './types';

export const Popup = forwardRef< HTMLDivElement, AutocompletePopupProps >(
	function Popup(
		{ className, portal, positioner, width, ...restProps },
		ref
	) {
		const popupContent = (
			<_Autocomplete.Popup
				ref={ ref }
				className={ clsx(
					itemPopupStyles.popup,
					getItemPopupWidthClassName( width ),
					className
				) }
				{ ...restProps }
			/>
		);

		const positionedPopup = renderSlotWithChildren(
			positioner,
			<Positioner />,
			popupContent
		);

		return renderSlotWithChildren( portal, <Portal />, positionedPopup );
	}
);
