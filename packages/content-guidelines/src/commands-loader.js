/**
 * Global Command Palette commands loader.
 *
 * This entry point is enqueued across the entire WordPress admin
 * to register Content Guidelines commands in the admin-wide Command Palette.
 *
 * @package ContentGuidelines
 * @since 0.2.0
 */

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import { PluginArea } from '@wordpress/plugins';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './store'; // Ensure store is registered
import ContentGuidelinesCommands from './commands';

/**
 * Register the commands plugin.
 *
 * This uses the WordPress plugin API to register our commands
 * component which will hook into the Command Palette system.
 */
registerPlugin( 'content-guidelines-commands', {
	render: ContentGuidelinesCommands,
} );

/**
 * Initialize the plugin area if not already present.
 *
 * The PluginArea component is needed for plugins registered
 * via registerPlugin to be rendered and activated.
 */
function initCommandsPluginArea() {
	// Check if there's already a plugin area mount point
	let mountPoint = document.getElementById(
		'content-guidelines-commands-mount'
	);

	if ( ! mountPoint ) {
		mountPoint = document.createElement( 'div' );
		mountPoint.id = 'content-guidelines-commands-mount';
		mountPoint.style.display = 'none';
		document.body.appendChild( mountPoint );
	}

	// Only render if we have the commands package available
	if ( typeof wp !== 'undefined' && wp.commands ) {
		const root = createRoot( mountPoint );
		root.render( <PluginArea scope="content-guidelines" /> );
	}
}

// Initialize when DOM is ready
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initCommandsPluginArea );
} else {
	initCommandsPluginArea();
}
