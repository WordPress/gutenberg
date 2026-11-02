import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';
import InternalTooltip from '.';
import type { TooltipProps } from './types';

function UnforwardedDeprecatedTooltip(
	props: TooltipProps,
	ref: React.ForwardedRef< any >
) {
	deprecated( 'wp.components.Tooltip', {
		since: '7.3',
		version: '7.5',
		alternative: 'Tooltip from @wordpress/ui',
	} );

	return <InternalTooltip { ...props } ref={ ref } />;
}

/**
 * Renders floating text when its anchor receives focus or is hovered.
 *
 * @deprecated Use `Tooltip` from `@wordpress/ui` instead.
 */
const DeprecatedTooltip = forwardRef( UnforwardedDeprecatedTooltip );
DeprecatedTooltip.displayName = 'Tooltip';

export default DeprecatedTooltip;
