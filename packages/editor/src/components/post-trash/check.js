/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function PostTrashCheck( { children } ) {
	const { isEditedPostNew, getCurrentPostId } = useSelect( 'core/editor' );
	const isNew = isEditedPostNew();
	const postId = getCurrentPostId();
	if ( isNew || ! postId ) {
		return null;
	}

	return children;
}
