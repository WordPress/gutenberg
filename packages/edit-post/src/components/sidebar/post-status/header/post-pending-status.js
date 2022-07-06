/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function PostPendingStatus() {
	const status = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'status' ),
		[]
	);

	const { editPost } = useDispatch( editorStore );

	return (
		<MenuItem
			icon={ status === 'pending' ? check : null }
			isSelected={ status === 'pending' }
			role="menuitemcheckbox"
			onClick={ () => {
				editPost( {
					status: status === 'pending' ? 'draft' : 'pending',
				} );
			} }
		>
			{ __( 'Mark as pending' ) }
		</MenuItem>
	);
}
