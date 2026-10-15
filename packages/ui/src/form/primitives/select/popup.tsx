import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef, useContext } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { IframeOutsidePressContext } from '../../../utils/use-iframe-outside-press-forwarding';
import { Portal } from './portal';
import { Positioner } from './positioner';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import { getItemPopupWidthClassName } from '../../../utils/css/item-popup';
import type { SelectPopupProps } from './types';
import styles from './style.module.css';

export const Popup = forwardRef< HTMLDivElement, SelectPopupProps >(
	function UnforwardedPopup(
		{ className, portal, positioner, width, children, ...restProps },
		ref
	) {
		const popupRef = useContext( IframeOutsidePressContext );
		const mergedRef = useMergeRefs( [ ref, popupRef ] );
		const popupContent = (
			<_Select.Popup
				ref={ mergedRef }
				className={ clsx(
					itemPopupStyles.popup,
					getItemPopupWidthClassName( width ),
					className
				) }
				{ ...restProps }
			>
				<_Select.List
					className={ clsx(
						itemPopupStyles[ 'list-chrome' ],
						styles.list
					) }
				>
					{ children }
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
