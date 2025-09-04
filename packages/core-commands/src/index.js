/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { CommandMenu } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import { useAdminNavigationCommands } from './admin-navigation-commands';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { unlock } from './lock-unlock';
export { privateApis } from './private-apis';

const { RouterProvider } = unlock( routerPrivateApis );

// Register core commands and render the Command Palette.
function CommandPalette() {
	useAdminNavigationCommands();
	useSiteEditorNavigationCommands();
	return (
		<RouterProvider pathArg="p">
			<CommandMenu />
		</RouterProvider>
	);
}

/**
 * Initializes the Command Palette.
 */
export function initializeCommandPalette() {
	const root = document.createElement( 'div' );
	document.body.appendChild( root );
	createRoot( root ).render(
		<StrictMode>
			<CommandPalette />
		</StrictMode>
	);
}
