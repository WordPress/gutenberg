/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

function PostTrashCheck( { isNew, postId, canUserDelete, children } ) {
	if ( isNew || ! postId || ! canUserDelete ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { isEditedPostNew, getCurrentPostId, getCurrentPostType } = select(
		'core/editor'
	);
	const { getPostType, canUser } = select( 'core' );
	const postId = getCurrentPostId();
	const postType = getPostType( getCurrentPostType() );
	const resource = postType?.rest_base || ''; // eslint-disable-line camelcase

	return {
		isNew: isEditedPostNew(),
		postId,
		canUserDelete:
			postId && resource ? canUser( 'delete', resource, postId ) : false,
	};
} )( PostTrashCheck );
