/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostTrash() {
	const { isNew, postId } = useSelect( ( select ) => {
		const store = select( editorStore );
		return {
			isNew: store.isEditedPostNew(),
			postId: store.getCurrentPostId(),
		};
	}, [] );
	const { trashPost } = useDispatch( editorStore );

	if ( isNew || ! postId ) {
		return null;
	}

	return (
		<Button
			className="editor-post-trash"
			isDestructive
			variant="secondary"
			onClick={ () => trashPost() }
		>
			{ __( 'Move to trash' ) }
		</Button>
	);
}
