import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
import type { BasePost, ActionScriptParts } from '../../shared/types';

const quickEdit: ActionScriptParts< BasePost > = {
	label( items ) {
		return items.length > 1 ? __( 'Bulk edit' ) : __( 'Quick edit' );
	},
	icon: drawerRight,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, { onActionPerformed } ) {
		// Where the quick edit form is depends on the screen listing the
		// pages, so the action only signals it was performed: the screen
		// opens the form.
		onActionPerformed?.( posts );
	},
};

/**
 * The JavaScript parts of the action editing pages from a form next to their
 * list; its data is in `action.php`.
 *
 * The action does not open the form by itself: its callback only calls
 * `onActionPerformed` with the pages. The screen listing the action opens the
 * form from the `onActionPerformed( actionId, items )` handler it passes to
 * `usePostActions`, when `actionId` is `quick-edit`. In a list that does not
 * handle it, the action does nothing.
 */
export default quickEdit;
