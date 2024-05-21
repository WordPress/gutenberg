/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostTrashCheck( { children } ) {
	const { canTrashPost } = useSelect( ( select ) => {
		const { isEditedPostNew, getCurrentPostId, getCurrentPostType } =
			select( editorStore );
		const { getPostType, canUser } = select( coreStore );
		const postType = getPostType( getCurrentPostType() );
		const postId = getCurrentPostId();
		const isNew = isEditedPostNew();
		const resource = postType?.rest_base || ''; // eslint-disable-line camelcase
		const canUserDelete =
			postId && resource ? canUser( 'delete', resource, postId ) : false;

		return {
			canTrashPost: ( ! isNew || postId ) && canUserDelete,
		};
	}, [] );

	if ( ! canTrashPost ) {
		return null;
	}

	return children;
}
