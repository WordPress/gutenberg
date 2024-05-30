/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Wrapper component that renders its children only if the post can trashed.
 *
 * @param {Object}  props          - The component props.
 * @param {Element} props.children - The child components to render.
 *
 * @return {Component|null} The rendered child components or null if the post can not trashed.
 */
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
