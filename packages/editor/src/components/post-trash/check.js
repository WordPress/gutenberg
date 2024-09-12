/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { GLOBAL_POST_TYPES } from '../../store/constants';

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
		const { canUser } = select( coreStore );
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		const isNew = isEditedPostNew();
		const canUserDelete = !! postId
			? canUser( 'delete', {
					kind: 'postType',
					name: postType,
					id: postId,
			  } )
			: false;

		return {
			canTrashPost:
				( ! isNew || postId ) &&
				canUserDelete &&
				! GLOBAL_POST_TYPES.includes( postType ),
		};
	}, [] );
	if ( ! canTrashPost ) {
		return null;
	}

	return children;
}
