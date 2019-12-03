/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

function PostTrashCheck( { canUserTrash, isNew, postId, children } ) {
	if ( ! canUserTrash || isNew || ! postId ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { isEditedPostNew, getCurrentPostId } = select( 'core/editor' );
	const { canUser } = select( 'core' );
	const postId = getCurrentPostId();

	return {
		isNew: isEditedPostNew(),
		canUserTrash: !! postId && canUser( 'delete', 'posts', postId ),
		postId,
	};
} )( PostTrashCheck );
