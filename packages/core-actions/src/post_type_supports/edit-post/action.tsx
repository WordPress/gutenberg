import { store as editorStore } from '@wordpress/editor';
import { pencil } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';
import type { Post, ActionScriptParts } from '../../shared/types';

const editPost: ActionScriptParts< Post > = {
	icon: pencil,
	isEligible( post ) {
		// The lists of patterns also show the patterns of the theme, which
		// are not entity records: they have no id, and cannot be edited.
		return post.status !== 'trash' && post.id !== undefined;
	},
	callback( posts, { registry } ) {
		const post = posts[ 0 ];
		// The screen showing the action sets how it opens an entity, see
		// `setEntityNavigator` in the editor store. Without it, the action
		// does nothing.
		const navigator = unlock(
			registry.select( editorStore )
		).getEntityNavigator();
		navigator?.( { postType: post.type, postId: post.id } );
	},
};

/**
 * The JavaScript parts of the edit post action; its data is in `action.php`.
 * It opens the entity with the entity navigator of the screen, so a screen
 * showing the action must set one with `setEntityNavigator`.
 */
export default editPost;
