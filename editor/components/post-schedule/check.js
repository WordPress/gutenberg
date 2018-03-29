/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function PostScheduleCheck( { canPublishPosts, children } ) {
	if ( ! canPublishPosts ) {
		return null;
	}

	return children;
}

export default withSelect(
	( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
)( PostScheduleCheck );
