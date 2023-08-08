/**
 * External dependencies
 */
import {
	Tooltip,
	TooltipAnchor,
	TooltipArrow,
	useTooltipStore,
} from '@ariakit/react/tooltip';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { TOOLTIP_DELAY } from '../../tooltip/';
import type { ToolTipProps } from './types';
import Shortcut from '../../shortcut';
import { positionToPlacement } from '../../popover/utils';
import { contextConnectWithoutRef } from '../context/context-connect';

function AriaToolTip( props: ToolTipProps ) {
	const { children, delay = TOOLTIP_DELAY, position, shortcut, text } = props;

	const baseId = useInstanceId( ToolTip, 'tooltip' );
	const describedById = text || shortcut ? baseId : undefined;

	const DEFAULT_PLACEMENT = 'bottom';

	// Compute tooltip's placement:
	// - compute it from the legacy `position` prop (if defined)
	// - otherwise, fallback to the DEFAULT_PLACEMENT.
	let computedPlacement;

	if ( position !== undefined ) {
		computedPlacement = positionToPlacement( position );
	} else {
		computedPlacement = DEFAULT_PLACEMENT;
	}

	const tooltipStore = useTooltipStore( {
		// TODO:
		// Placement doesn't have type 'overlay' from positionToPlacement
		// can remove the ignore once position has been fully deprecated
		// @ts-ignore
		placement: computedPlacement,
		timeout: delay,
	} );

	return (
		<>
			<TooltipAnchor
				onBlur={ () => tooltipStore.hide() }
				render={ children }
				store={ tooltipStore }
			/>
			{ ( text || shortcut ) && (
				<Tooltip
					className="components-ariakit-tooltip"
					id={ describedById }
					gutter={ 4 }
					store={ tooltipStore }
					// hide when interacting with anchor to match legacy
					hideOnInteractOutside={ () => {
						tooltipStore.setOpen( ( open ) => ! open );
						return true;
					} }
				>
					{ text }
					{ shortcut && (
						<Shortcut
							className={
								text ? 'components-ariakit-shortcut' : ''
							}
							shortcut={ shortcut }
						/>
					) }
					<TooltipArrow size={ 0.0001 } />
				</Tooltip>
			) }
		</>
	);
}

export const ToolTip = contextConnectWithoutRef( AriaToolTip, 'ToolTip' );
