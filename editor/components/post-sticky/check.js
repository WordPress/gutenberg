/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function PostStickyCheck( { postType, children, canEditOtherPosts, canPublishPosts } ) {
	if (
		postType !== 'post' ||
		! canPublishPosts ||
		! canEditOtherPosts
	) {
		return null;
	}

	return children;
}

export default withSelect(
	( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		const postType = getEditedPostAttribute( 'type' );
		return {
			canPublishPosts: getUserPostTypeCapability( postType, 'publish_posts' ),
			canEditOtherPosts: getUserPostTypeCapability( postType, 'edit_others_posts' ),
			postType,
		};
	},
)( PostStickyCheck );
