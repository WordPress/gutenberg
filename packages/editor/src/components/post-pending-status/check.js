/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

export function PostPendingStatusCheck( { hasPublishAction, isPublished, children } ) {
	if ( isPublished || ! hasPublishAction ) {
		return null;
	}

	return children;
}

export default compose(
	withSelect( ( select ) => {
		const { isCurrentPostPublished, getCurrentPostType, getCurrentPostId } = select( 'core/editor' );
		return {
			hasPublishAction: select( 'core' ).canUser( 'publish', 'posts', getCurrentPostId() ),
			isPublished: isCurrentPostPublished(),
			postType: getCurrentPostType(),
		};
	} )
)( PostPendingStatusCheck );
