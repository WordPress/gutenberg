/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function ToolbarItem( { children, ...props }, ref ) {
	if ( typeof children !== 'function' ) {
		// eslint-disable-next-line no-console
		console.warn( '`ToolbarItem` is a generic headless component that accepts only function children props' );
		return null;
	}

	return children( { ...props, ref } );
}

export default forwardRef( ToolbarItem );
