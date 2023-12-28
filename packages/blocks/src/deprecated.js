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
 * @param {Component} OriginalComponent The component to enhance.
 * @return {Component} The same component.
 */
export function withBlockContentContext( OriginalComponent ) {
	deprecated( 'wp.blocks.withBlockContentContext', {
		since: '6.1',
	} );

	return OriginalComponent;
}
