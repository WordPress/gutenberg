import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Portal } from './portal';
import { Positioner } from './positioner';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { getItemPopupWidthClassName } from '../../../utils/css/item-popup';
import type { SelectPopupProps } from './types';

export const Popup = forwardRef< HTMLDivElement, SelectPopupProps >(
	function Popup(
		{ className, portal, positioner, popupWidth, children, ...restProps },
		ref
	) {
		const popupContent = (
			<_Select.Popup
				ref={ ref }
				className={ clsx(
					itemPopupStyles.popup,
					getItemPopupWidthClassName( popupWidth ),
					className
				) }
				{ ...restProps }
			>
				<_Select.List className={ itemPopupStyles.list }>
					<div
						className={
							itemPopupStyles[ 'list-scrollable-container' ]
						}
					>
						{ children }
					</div>
				</_Select.List>
			</_Select.Popup>
		);

		const positionedPopup = renderSlotWithChildren(
			positioner,
			<Positioner />,
			popupContent
		);

		return renderSlotWithChildren( portal, <Portal />, positionedPopup );
	}
);
