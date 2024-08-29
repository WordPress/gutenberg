/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { collabComment } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';

export default function BlockCommentMenuItem( { onClose } ) {
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );

	const openCollabBoard = () => {
		onClose();
		openGeneralSidebar( 'edit-post/collab-sidebar' );
	};

	return (
		<MenuItem
			icon={ collabComment }
			onClick={ openCollabBoard }
			aria-haspopup="dialog"
		>
			{ __( 'Add Comment' ) }
		</MenuItem>
	);
}
