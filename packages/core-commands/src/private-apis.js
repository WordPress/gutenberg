/**
 * Internal dependencies
 */
import { useAdminNavigationCommands } from './admin-navigation-commands';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { lock } from './lock-unlock';

function useCommands() {
	useAdminNavigationCommands();
	useSiteEditorNavigationCommands();
}

export const privateApis = {};
lock( privateApis, {
	useCommands,
} );
