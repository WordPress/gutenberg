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
	return usePostTrashCheck() ? children : null;
}

export function usePostTrashCheck() {
	return useSelect( ( select ) => {
		const isNew = select( editorStore ).isEditedPostNew();
		const postId = select( editorStore ).getCurrentPostId();
		if ( isNew || ! postId ) {
			return false;
		}

		const postTypeSlug = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( postTypeSlug );
		const resource = postType?.rest_base || '';
		if ( ! resource ) {
			return false;
		}

		return select( coreStore ).canUser( 'delete', resource, postId );
	}, [] );
}
