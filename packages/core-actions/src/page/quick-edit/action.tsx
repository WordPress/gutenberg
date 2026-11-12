import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';
import type { BasePost, ActionScriptParts } from '../../shared/types';

const quickEdit: ActionScriptParts< BasePost > = {
	label( items ) {
		return items.length > 1 ? __( 'Bulk edit' ) : __( 'Quick edit' );
	},
	icon: drawerRight,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, { registry } ) {
		// The screen listing the pages sets how it opens their quick edit
		// form, see `setQuickEditOpener` in the editor store. Without it,
		// the action does nothing.
		const opener = unlock(
			registry.select( editorStore )
		).getQuickEditOpener();
		opener?.( {
			postType: posts[ 0 ].type,
			postIds: posts.map( ( post ) => post.id ),
		} );
	},
};

/**
 * The JavaScript parts of the quick edit action of pages; its data is in
 * `action.php`. It opens the quick edit form with the opener of the screen,
 * so a screen showing the action must set one with `setQuickEditOpener`.
 */
export default quickEdit;
