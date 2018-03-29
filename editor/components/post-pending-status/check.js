/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function PostPendingStatusCheck( { isPublished, children, canPublishPosts } ) {
	if ( isPublished || ! canPublishPosts ) {
		return null;
	}

	return children;
}

export default withSelect(
	( select ) => {
		const { getEditedPostAttribute, isCurrentPostPublished } = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {
			isPublished: isCurrentPostPublished(),
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
)( PostPendingStatusCheck );
