/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Custom hook for managing the post title in the editor.
 *
 * @return {Object} An object containing the current title and a function to update the title.
 */
export default function usePostTitle() {
	const { editPost } = useDispatch( editorStore );
	const { title } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );

		return {
			title: getEditedPostAttribute( 'title' ),
		};
	}, [] );

	function updateTitle( newTitle ) {
		editPost( { title: newTitle } );
	}

	return { title, setTitle: updateTitle };
}
