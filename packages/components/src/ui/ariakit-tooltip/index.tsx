/**
 * External dependencies
 */
import { Tooltip, TooltipAnchor, useTooltipState } from 'ariakit/tooltip';
import { Slot } from '@radix-ui/react-slot';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { TOOLTIP_DELAY } from '../../tooltip/';
import type { ToolTipProps } from './types';
import Shortcut from '../../shortcut';
import { positionToPlacement } from '../../popover/utils';
import * as styles from './styles';
import { contextConnectWithoutRef } from '../context/context-connect';
import { useCx } from '../../utils/hooks/use-cx';

function AriaToolTip( props: ToolTipProps ) {
	const {
		children,
		delay = TOOLTIP_DELAY,
		placement,
		position,
		shortcut,
		text,
	} = props;

	const baseId = useInstanceId( ToolTip, 'tooltip' );
	const describedById = text || shortcut ? baseId : undefined;

	const DEFAULT_PLACEMENT = 'bottom';

	// Compute tooltip's placement:
	// - give priority to `placement` prop, if defined
	// - otherwise, compute it from the legacy `position` prop (if defined)
	// - finally, fallback to the DEFAULT_PLACEMENT.
	let computedPlacement;
	if ( placement !== undefined ) {
		computedPlacement = placement;
	} else if ( position !== undefined ) {
		computedPlacement = positionToPlacement( position );
	}
	computedPlacement = computedPlacement || DEFAULT_PLACEMENT;

	if ( position !== undefined ) {
		deprecated( '`position` prop in wp.components.tooltip', {
			since: '6.3',
			alternative: '`placement` prop',
		} );
	}

	const tooltipState = useTooltipState( {
		placement: computedPlacement,
		timeout: delay,
	} );

	const cx = useCx();
	const ToolTipClassName = cx( styles.ToolTip );
	const ShortcutClassName = cx( styles.Shortcut );

	return (
		<>
			<TooltipAnchor as={ Slot } described state={ tooltipState }>
				{ children }
			</TooltipAnchor>
			{ ( text || shortcut ) && (
				<Tooltip
					className={ ToolTipClassName }
					id={ describedById }
					state={ tooltipState }
				>
					{ text }
					{ shortcut && (
						<Shortcut
							className={ text ? ShortcutClassName : '' }
							shortcut={ shortcut }
						/>
					) }
				</Tooltip>
			) }
		</>
	);
}

export const ToolTip = contextConnectWithoutRef( AriaToolTip, 'ToolTip' );
