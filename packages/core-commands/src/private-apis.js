/**
 * Internal dependencies
 */
import { useAddPostTypeCommands } from './add-post-type-commands';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { lock } from './lock-unlock';

function useCommands() {
	useAddPostTypeCommands();
	useSiteEditorNavigationCommands();
}

export const privateApis = {};
lock( privateApis, {
	useCommands,
} );
