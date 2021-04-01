/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export default function DropZoneProvider( { children } ) {
	deprecated( 'wp.components.DropZoneProvider', {
		hint:
			'wp.component.DropZone no longer needs a provider. wp.components.DropZoneProvider is safe to remove from your code.',
	} );
	return children;
}
