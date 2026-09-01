import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Portal } from './portal';
import { Positioner } from './positioner';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { getItemPopupWidthClassName } from '../../../utils/css/item-popup';
import type { ComboboxPopupProps } from './types';

export const Popup = forwardRef< HTMLDivElement, ComboboxPopupProps >(
	function Popup(
		{ className, portal, positioner, popupWidth, ...restProps },
		ref
	) {
		const popupContent = (
			<_Combobox.Popup
				ref={ ref }
				className={ clsx(
					itemPopupStyles.popup,
					getItemPopupWidthClassName( popupWidth ),
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
