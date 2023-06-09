/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	DropdownMenu,
	TextControl,
	MenuItem,
	MenuGroup,
	Modal,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

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
		handleChange,
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
				<Modal title="Rename" onRequestClose={ closeModal }>
					<form>
						<VStack spacing="3">
							<TextControl
								__nextHasNoMarginBottom
								value={ editedMenuTitle }
								placeholder={ __( 'Navigation title' ) }
								onChange={ handleChange }
							/>
							<HStack justify="right">
								<Button
									variant="tertiary"
									onClick={ closeModal }
								>
									{ __( 'Cancel' ) }
								</Button>

								<Button
									variant="primary"
									type="submit"
									onClick={ handleSave }
								>
									{ __( 'Save' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}
