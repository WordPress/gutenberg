/**
 * External dependencies
 */
import { Tooltip, TooltipAnchor, useTooltipState } from 'ariakit/tooltip';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Shortcut from '../../shortcut';
import { TOOLTIP_DELAY } from '../../tooltip/';
import type { ToolTipProps } from './types';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from '../../popover/utils';
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


	const DEFAULT_PLACEMENT = 'bottom';

	// Compute tooltip's placement:
	// - give priority to `placement` prop, if defined
	// - otherwise, compute it from the legacy `position` prop (if defined)
	// - finally, fallback to the DEFAULT_PLACEMENT.
	let computedPlacement;
	if ( placement !== undefined ) {
		computedPlacement = placement;
	} else if ( position !== undefined ) {
		computedPlacement =
			// @ts-expect-error
			__experimentalPopoverLegacyPositionToPlacement( position );
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

	const isOnlyChild = () => {
		if ( Children.toArray( children?.props?.children ).length === 1 ) {
			return children;
		}
		if ( 'development' === process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			return console.error(
				'ToolTip should be called with only a single child element.'
			);
		}
	};

	const cx = useCx();
	const ToolTipClassName = cx( styles.ToolTip );
	const ToolTipAnchorClassName = cx( styles.ToolTipAnchor );
	const ShortcutClassName = cx( styles.Shortcut );

	return (
		<>
			<TooltipAnchor
				className={ ToolTipAnchorClassName }
				state={ tooltipState }
			>
				{ children }
			</TooltipAnchor>
			{ ( text || shortcut ) && isOnlyChild() && (
				<Tooltip className={ ToolTipClassName } state={ tooltipState }>
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
