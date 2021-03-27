/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export default function DropZoneProvider( { children } ) {
	deprecated( 'wp.components.DropZoneProvider', {
		hint: 'wp.component.DropZone no longer needs a provider.',
	} );
	return children;
}
