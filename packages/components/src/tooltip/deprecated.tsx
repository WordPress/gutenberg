import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';
import { UnforwardedTooltip } from '.';
import type { TooltipProps } from './types';

function UnforwardedDeprecatedTooltip(
	props: TooltipProps,
	ref: React.ForwardedRef< any >
) {
	deprecated( 'wp.components.Tooltip', {
		since: '7.2',
		version: '7.4',
		alternative: 'Tooltip from @wordpress/ui',
	} );

	return UnforwardedTooltip( props, ref );
}

/**
 * Renders floating text when its anchor receives focus or is hovered.
 *
 * @deprecated Use `Tooltip` from `@wordpress/ui` instead.
 */
const DeprecatedTooltip = forwardRef( UnforwardedDeprecatedTooltip );

export default DeprecatedTooltip;
