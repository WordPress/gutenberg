/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function PostVisibilityCheck( { canPublishPosts, render } ) {
	return render( { canEdit: canPublishPosts } );
}

export default withSelect(
	( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
)( PostVisibilityCheck );
