/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export default function( registry ) {
	deprecated( 'wp.data.plugins.controls', {
		hint: 'The controls plugins is now baked-in.',
	} );
	return registry;
}
