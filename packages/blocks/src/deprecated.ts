/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * A Higher Order Component used to inject BlockContent using context to the
 * wrapped component.
 *
 * @deprecated
 *
 * @param OriginalComponent The component to enhance.
 * @return The same component.
 */
export function withBlockContentContext< T >( OriginalComponent: T ): T {
	deprecated( 'wp.blocks.withBlockContentContext', {
		since: '6.1',
	} );

	return OriginalComponent;
}
