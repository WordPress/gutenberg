/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

export function PostVisibilityCheck( { hasPublishAction, render } ) {
	const canEdit = hasPublishAction;
	return render( { canEdit } );
}

export default compose( [
	withSelect( ( select ) => {
		const { canUser } = select( 'core' );
		const { getCurrentPostId, getCurrentPostType } = select( 'core/editor' );
		return {
			hasPublishAction: canUser( 'publish', 'posts', getCurrentPostId() ),
			postType: getCurrentPostType(),
		};
	} ),
] )( PostVisibilityCheck );
