/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react/tooltip';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TooltipProps } from './types';
import Shortcut from '../shortcut';
import { positionToPlacement } from '../popover/utils';

/**
 * Time over anchor to wait before showing tooltip
 *
 * @type {number}
 */
export const TOOLTIP_DELAY = 700;

function Tooltip( props: TooltipProps ) {
	const { children, delay = TOOLTIP_DELAY, position, shortcut, text } = props;

	const baseId = useInstanceId( Tooltip, 'tooltip' );
	const describedById = text || shortcut ? baseId : undefined;

	const isOnlyChild = Children.count( children ) === 1;
	// console error if more than one child element is added
	if ( ! isOnlyChild ) {
		if ( 'development' === process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.error(
				'Tooltip should be called with only a single child element.'
			);
		}
	}

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

	const tooltipStore = Ariakit.useTooltipStore( {
		// TODO: can remove the ignore once position has been fully deprecated
		// Type error due to 'overlay' type from positionToPlacement
		// @ts-ignore
		placement: computedPlacement,
		timeout: delay,
	} );

	return (
		<>
			<Ariakit.TooltipAnchor
				onBlur={ tooltipStore.hide }
				onClick={ tooltipStore.hide }
				store={ tooltipStore }
				render={ isOnlyChild ? children : undefined }
			>
				{ ! isOnlyChild ? children : null }
			</Ariakit.TooltipAnchor>
			{ isOnlyChild && ( text || shortcut ) && (
				<Ariakit.Tooltip
					className="components-tooltip"
					gutter={ 4 }
					id={ describedById }
					overflowPadding={ 0.5 }
					store={ tooltipStore }
				>
					{ text }
					{ shortcut && (
						<Shortcut
							className={
								text ? 'components-tooltip__shortcut' : ''
							}
							shortcut={ shortcut }
						/>
					) }
				</Ariakit.Tooltip>
			) }
		</>
	);
}

export default Tooltip;
