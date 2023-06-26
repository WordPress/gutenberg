/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RenameModal from './rename-modal';
import DeleteModal from './delete-modal';

const POPOVER_PROPS = {
	position: 'bottom right',
};

export default function ScreenNavigationMoreMenu( props ) {
	const { onDelete, onSave, onDuplicate, menuTitle } = props;

	const [ renameModalOpen, setRenameModalOpen ] = useState( false );
	const [ deleteModalOpen, setDeleteModalOpen ] = useState( false );

	const closeModals = () => {
		setRenameModalOpen( false );
		setDeleteModalOpen( false );
	};
	const openRenameModal = () => setRenameModalOpen( true );
	const openDeleteModal = () => setDeleteModalOpen( true );

	return (
		<>
			<DropdownMenu
				className="sidebar-navigation__more-menu"
				icon={ moreVertical }
				popoverProps={ POPOVER_PROPS }
			>
				{ ( { onClose } ) => (
					<div>
						<MenuGroup>
							<MenuItem
								onClick={ () => {
									openRenameModal();
									// Close the dropdown after opening the modal.
									onClose();
								} }
							>
								{ __( 'Rename' ) }
							</MenuItem>
							<MenuItem
								onClick={ () => {
									onDuplicate();
									onClose();
								} }
							>
								{ __( 'Duplicate' ) }
							</MenuItem>
						</MenuGroup>
						<MenuGroup>
							<MenuItem
								onClick={ () => {
									openDeleteModal();

									// Close the dropdown after opening the modal.
									onClose();
								} }
							>
								{ __( 'Delete' ) }
							</MenuItem>
						</MenuGroup>
					</div>
				) }
			</DropdownMenu>

			{ deleteModalOpen && (
				<DeleteModal onClose={ closeModals } onConfirm={ onDelete } />
			) }

			{ renameModalOpen && (
				<RenameModal
					onClose={ closeModals }
					menuTitle={ menuTitle }
					onSave={ onSave }
				/>
			) }
		</>
	);
}
