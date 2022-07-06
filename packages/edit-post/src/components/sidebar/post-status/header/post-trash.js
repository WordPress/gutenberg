/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { MenuItem } from '@wordpress/components';
import { trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function PostTrash() {
	const { trashPost } = useDispatch( editorStore );
	return (
		<MenuItem
			className="edit-post-post-status__post-trash"
			icon={ trash }
			isDestructive
			onClick={ () => trashPost() }
		>
			{ __( 'Move to trash' ) }
		</MenuItem>
	);
}
