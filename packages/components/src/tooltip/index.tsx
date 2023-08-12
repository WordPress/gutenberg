/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react/tooltip';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

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
				onBlur={ () => tooltipStore.hide() }
				render={ children }
				store={ tooltipStore }
			/>
			{ ( text || shortcut ) && (
				<Ariakit.Tooltip
					className="components-tooltip"
					gutter={ 4 }
					// 	hide tooltip when interacting with its anchor to match legacy tooltip
					hideOnInteractOutside={ () => {
						tooltipStore.setOpen( ( open ) => ! open );
						return true;
					} }
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
					<Ariakit.TooltipArrow
						// 	 TODO: Remove when floating-ui/core is updated above 1.0.1
						//  Required workaround, related to github.com/WordPress/gutenberg/pull/48402
						size={ 0.0001 }
					/>
				</Ariakit.Tooltip>
			) }
		</>
	);
}

export default Tooltip;
