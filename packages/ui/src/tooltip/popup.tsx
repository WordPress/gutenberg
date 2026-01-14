/**
 * External dependencies
 */
import clsx from 'clsx';
import { Tooltip } from '@base-ui/react/tooltip';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { PopupProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

const Popup = forwardRef< HTMLDivElement, PopupProps >( function TooltipPopup(
	{
		align = 'center',
		side = 'bottom',
		sideOffset = 4,
		children,
		className,
		style,
		...props
	},
	ref
) {
	return (
		<Tooltip.Portal>
			<Tooltip.Positioner
				align={ align }
				side={ side }
				sideOffset={ sideOffset }
				style={ style }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					className,
					styles.positioner
				) }
			>
				<Tooltip.Popup
					ref={ ref }
					className={ styles.popup }
					{ ...props }
				>
					{ children }
				</Tooltip.Popup>
			</Tooltip.Positioner>
		</Tooltip.Portal>
	);
} );

export { Popup };
