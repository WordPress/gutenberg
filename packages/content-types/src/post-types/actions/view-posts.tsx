/**
 * WordPress dependencies
 */
import type { Action } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { PostTypeFormData } from '../types';

const viewPostsAction: Action< PostTypeFormData > = {
	id: 'view-posts',
	label: __( 'View posts' ),
	icon: external,
	isPrimary: true,
	// Drafts are not registered with WordPress, so `edit.php?post_type=…`
	// would 404. Only surface the link for active post types.
	isEligible: ( item ) => item.status === 'publish',
	callback: ( items, { onActionPerformed } ) => {
		const item = items[ 0 ];
		if ( ! item?.slug ) {
			return;
		}
		document.location.href = addQueryArgs( 'edit.php', {
			post_type: item.slug,
		} );
		onActionPerformed?.( items );
	},
};

export default viewPostsAction;
