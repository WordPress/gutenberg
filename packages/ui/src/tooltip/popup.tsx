import clsx from 'clsx';
import { Tooltip as _Tooltip } from '@base-ui/react/tooltip';
import { forwardRef } from '@wordpress/element';
import type { PopupProps } from './types';
import { Portal } from './portal';
import { Positioner } from './positioner';
import { renderSlotWithChildren } from '../utils/render-slot-with-children';
import styles from './style.module.css';

const Popup = forwardRef< HTMLDivElement, PopupProps >( function TooltipPopup(
	{ portal, positioner, children, className, ...props },
	ref
) {
	const popupContent = (
		<_Tooltip.Popup
			ref={ ref }
			className={ clsx( styles.popup, className ) }
			{ ...props }
		>
			{ children }
		</_Tooltip.Popup>
	);

	const positionedPopup = renderSlotWithChildren(
		positioner,
		<Positioner />,
		popupContent
	);

	return renderSlotWithChildren( portal, <Portal />, positionedPopup );
} );

export { Popup };
