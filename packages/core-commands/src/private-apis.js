/**
 * Internal dependencies
 */
import { useAdminNavigationCommands } from './admin-navigation-commands';
import { useAdminCommands } from './admin-commands';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { lock } from './lock-unlock';

function useCommands() {
	useAdminNavigationCommands();
	useSiteEditorNavigationCommands();
	useAdminCommands();
}

export const privateApis = {};
lock( privateApis, {
	useCommands,
} );
