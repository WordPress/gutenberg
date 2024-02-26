/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

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
