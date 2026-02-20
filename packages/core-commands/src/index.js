/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';
import { dispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as commandsStore, CommandMenu } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import { useAdminNavigationCommands } from './admin-navigation-commands';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { unlock } from './lock-unlock';
export { privateApis } from './private-apis';

const { RouterProvider } = unlock( routerPrivateApis );

const ADMIN_BAR_TRIGGER_SELECTOR = '#wp-admin-bar-command-palette a';

// Register core commands and render the Command Palette.
function CommandPalette( { settings } ) {
	const { menu_commands: menuCommands, is_network_admin: isNetworkAdmin } =
		settings;
	useAdminNavigationCommands( menuCommands );
	useSiteEditorNavigationCommands( isNetworkAdmin );
	return (
		<RouterProvider pathArg="p">
			<CommandMenu />
		</RouterProvider>
	);
}

/**
 * Initializes the Command Palette.
 *
 * @param {Object} settings Command palette settings.
 */
export function initializeCommandPalette( settings ) {
	const root = document.createElement( 'div' );
	document.body.appendChild( root );
	createRoot( root ).render(
		<StrictMode>
			<CommandPalette settings={ settings } />
		</StrictMode>
	);

	function attachAdminBarTrigger() {
		const trigger = document.querySelector( ADMIN_BAR_TRIGGER_SELECTOR );
		if ( ! trigger ) {
			return;
		}
		trigger.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			dispatch( commandsStore ).open();
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', attachAdminBarTrigger );
	} else {
		attachAdminBarTrigger();
	}
}
