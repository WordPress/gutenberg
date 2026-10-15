import { external } from '@wordpress/icons';
import type { BasePost } from '../../shared/types';
import type { ActionScriptParts } from '../../types';

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
 * View post action for BasePost.
 */
export default viewPost;
