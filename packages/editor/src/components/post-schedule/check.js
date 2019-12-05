/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

export function PostScheduleCheck( { hasPublishAction, children } ) {
	if ( ! hasPublishAction ) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( 'core/editor' );
		const { canUser } = select( 'core' );
		return {
			hasPublishAction: canUser( 'publish', 'posts', getCurrentPostId() ),
			postType: getCurrentPostType(),
		};
	} ),
] )( PostScheduleCheck );
