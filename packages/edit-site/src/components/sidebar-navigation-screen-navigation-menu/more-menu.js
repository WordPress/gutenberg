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

const POPOVER_PROPS = {
	position: 'bottom right',
	variant: 'toolbar',
};

export default function ScreenNavigationMoreMenu( props ) {
	const { handleDelete, handleSave, handleDuplicate, menuTitle } = props;

	const [ renameModalOpen, setRenameModalOpen ] = useState( false );

	const closeRenameModal = () => setRenameModalOpen( false );
	const openRenameModal = () => setRenameModalOpen( true );

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
									handleDuplicate();
									onClose();
								} }
							>
								{ __( 'Duplicate' ) }
							</MenuItem>
							<MenuItem
								isDestructive
								isTertiary
								onClick={ () => {
									handleDelete();
									onClose();
								} }
							>
								{ __( 'Delete' ) }
							</MenuItem>
						</MenuGroup>
					</div>
				) }
			</DropdownMenu>

			{ renameModalOpen && (
				<RenameModal
					onClose={ closeRenameModal }
					menuTitle={ menuTitle }
					handleSave={ handleSave }
				/>
			) }
		</>
	);
}
