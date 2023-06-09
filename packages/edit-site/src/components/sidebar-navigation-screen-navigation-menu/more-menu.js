/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RenameModal from './rename-modal';

const POPOVER_PROPS = {
	position: 'bottom right',
	variant: 'toolbar',
};

export default function ScreenNavigationMoreMenu( props ) {
	const {
		isOpen,
		setOpen,
		handleDelete,
		handleSave,
		onChange,
		handleDuplicate,
		editedMenuTitle,
	} = props;
	const closeModal = () => setOpen( false );
	const openModal = () => setOpen( true );

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
									openModal();
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

			{ isOpen && (
				<RenameModal
					onClose={ closeModal }
					onChange={ onChange }
					handleSave={ handleSave }
					editedMenuTitle={ editedMenuTitle }
				/>
			) }
		</>
	);
}
