/**
 * Internal dependencies
 */
import { withNext } from '../ui/context';
import { Tooltip as NextTooltip } from '../ui/tooltip';

const Tooltip =
	process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextTooltip : undefined;

const adapter = ( { text, ...props } ) => ( {
	...props,
	content: text,
} );

export function withNextComponent( Component ) {
	return withNext( Component, Tooltip, 'WPComponentsTooltip', adapter );
}
