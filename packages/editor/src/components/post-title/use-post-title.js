import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { store as editorStore } from '../../store';

/**
 * Custom hook for managing the post title in the editor.
 *
 * @return {Object} An object containing the current title and a function to update the title.
 */
export default function usePostTitle() {
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );

		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );

	const [ title, setTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		postId,
		{ coalesceEdits: true }
	);

	return { title, setTitle };
}
