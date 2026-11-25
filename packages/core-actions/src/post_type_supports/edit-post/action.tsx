import { pencil } from '@wordpress/icons';
import type { Post, ActionScriptParts } from '../../shared/types';

// The type of the patterns of the theme, which the lists of patterns show
// along the patterns of the user but which cannot be edited.
const THEME_PATTERN_TYPE = 'pattern';

const editPost: ActionScriptParts< Post > = {
	icon: pencil,
	isEligible( post ) {
		return post.status !== 'trash' && post.type !== THEME_PATTERN_TYPE;
	},
	callback( posts, { onActionPerformed } ) {
		// How a post is edited depends on the screen listing it, so the action
		// only signals it was performed: the screen opens the editor.
		onActionPerformed?.( posts );
	},
};

/**
 * The JavaScript parts of the action editing a post; its data is in
 * `action.php`.
 *
 * The action does not navigate by itself: its callback only calls
 * `onActionPerformed` with the posts. The screen listing the action opens the
 * editor from the `onActionPerformed( actionId, items )` handler it passes to
 * `usePostActions`, when `actionId` is `edit-post`. In a list that does not
 * handle it, the action does nothing.
 */
export default editPost;
