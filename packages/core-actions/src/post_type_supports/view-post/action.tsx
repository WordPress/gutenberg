import { external } from '@wordpress/icons';
import type { BasePost, ActionScriptParts } from '../../shared/types';

const viewPost: ActionScriptParts< BasePost > = {
	icon: external,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, { onActionPerformed } ) {
		const post = posts[ 0 ];
		window.open( post?.link, '_blank' );
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

/**
 * The JavaScript parts of the view post action for BasePost; its data is in
 * `action.php`.
 */
export default viewPost;
