/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import RenameModal from './rename-modal';
import DeleteConfirmDialog from './delete-confirm-dialog';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

const POPOVER_PROPS = {
	position: 'bottom right',
};

export default function ScreenNavigationMoreMenu( props ) {
	const { onDelete, onSave, onDuplicate, menuTitle, menuId } = props;

	const [ renameModalOpen, setRenameModalOpen ] = useState( false );
	const [ deleteConfirmDialogOpen, setDeleteConfirmDialogOpen ] =
		useState( false );

	const history = useHistory();

	const closeModals = () => {
		setRenameModalOpen( false );
		setDeleteConfirmDialogOpen( false );
	};
	const openRenameModal = () => setRenameModalOpen( true );
	const openDeleteConfirmDialog = () => setDeleteConfirmDialogOpen( true );

	return (
		<>
			<DropdownMenu
				className="sidebar-navigation__more-menu"
				label={ __( 'Actions' ) }
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
									history.push( {
										postId: menuId,
										postType: 'wp_navigation',
										canvas: 'edit',
									} );
								} }
							>
								{ __( 'Edit' ) }
							</MenuItem>
							<MenuItem
								onClick={ () => {
									onDuplicate();
									onClose();
								} }
							>
								{ __( 'Duplicate' ) }
							</MenuItem>
							<MenuItem
								isDestructive
								onClick={ () => {
									openDeleteConfirmDialog();

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
			{ deleteConfirmDialogOpen && (
				<DeleteConfirmDialog
					onClose={ closeModals }
					onConfirm={ onDelete }
				/>
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
