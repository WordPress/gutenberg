import { pencil } from '@wordpress/icons';
import type { BasePost, ActionScriptParts } from '../../shared/types';

const editPost: ActionScriptParts< BasePost > = {
	icon: pencil,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, { onActionPerformed } ) {
		// How a page is edited depends on the screen listing it, so the action
		// only signals it was performed: the screen opens the editor.
		onActionPerformed?.( posts );
	},
};

/**
 * The JavaScript parts of the action editing a page; its data is in
 * `action.php`.
 *
 * The action does not navigate by itself: its callback only calls
 * `onActionPerformed` with the pages. The screen listing the action opens the
 * editor from the `onActionPerformed( actionId, items )` handler it passes to
 * `usePostActions`, when `actionId` is `edit-post`. In a list that does not
 * handle it, the action does nothing.
 */
export default editPost;
