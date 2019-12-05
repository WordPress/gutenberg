/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

export function PostStickyCheck( { hasStickyAction, postType, children } ) {
	if (
		postType !== 'post' ||
		! hasStickyAction
	) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		const { canUser } = select( 'core' );
		const { getCurrentPostId, getCurrentPostType } = select( 'core/editor' );
		return {
			hasStickyAction: canUser( 'sticky', 'posts', getCurrentPostId() ),
			postType: getCurrentPostType(),
		};
	} ),
] )( PostStickyCheck );
