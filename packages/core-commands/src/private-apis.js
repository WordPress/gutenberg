/**
 * Internal dependencies
 */
import { useAdminNavigationCommands } from './admin-navigation-commands';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { lock } from './lock-unlock';

/**
 * @typedef CommandOptions
 *
 * @property {boolean} [isBlockTheme] Whether the current theme is a block theme.
 */

function useCommands( options = {} ) {
	useAdminNavigationCommands( options );
	useSiteEditorNavigationCommands( options );
}

export const privateApis = {};
lock( privateApis, {
	useCommands,
} );
