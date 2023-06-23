/**
 * Internal dependencies
 */
import { useAddPostTypeCommands } from './add-post-type-commands';
import { useManageReusableBlocksCommand } from './manage-reusable-blocks-command';
import { useSiteEditorNavigationCommands } from './site-editor-navigation-commands';
import { lock } from './lock-unlock';

function useCommands() {
	useAddPostTypeCommands();
	useManageReusableBlocksCommand();
	useSiteEditorNavigationCommands();
}

export const privateApis = {};
lock( privateApis, {
	useCommands,
} );
