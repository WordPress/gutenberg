/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostTrashCheck( { isNew, postId, canUserDelete, children } ) {
	if ( isNew || ! postId || ! canUserDelete ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { isEditedPostNew, getCurrentPostId, getCurrentPostType } = select(
		editorStore
	);
	const { getPostType, canUser } = select( coreStore );
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
