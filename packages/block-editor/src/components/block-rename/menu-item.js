/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useBlockRename from './use-block-rename';
import BlockRenameModal from './modal';

export default function BlockRenameMenuItem( { clientId } ) {
	const { canRename } = useBlockRename( clientId );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	if ( ! canRename ) {
		return null;
	}

	return (
		<>
			<MenuItem
				onClick={ toggleModal }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<BlockRenameModal
					clientId={ clientId }
					onClose={ toggleModal }
				/>
			) }
		</>
	);
}
