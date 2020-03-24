/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';

function ToolbarItem( { children, ...props }, ref ) {
	if ( typeof children !== 'function' ) {
		warning(
			'`ToolbarItem` is a generic headless component that accepts only function children props'
		);
		return null;
	}

	return children( { ...props, ref } );
}

export default forwardRef( ToolbarItem );
