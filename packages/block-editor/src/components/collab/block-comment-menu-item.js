/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { collabComment } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockCommentModal from './collab-board';

export default function BlockCommentMenuItem( { clientId } ) {
	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	return (
		<>
			<MenuItem
				icon={ collabComment }
				onClick={ toggleModal }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ __( 'Comment' ) }
			</MenuItem>
			{ isModalOpen && (
				<BlockCommentModal
					clientId={ clientId }
					onClose={ toggleModal }
				/>
			) }
		</>
	);
}
