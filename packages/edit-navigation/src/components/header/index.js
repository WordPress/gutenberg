/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Dropdown,
	DropdownMenu,
	Modal,
	MenuGroup,
	MenuItem,
	MenuItemsChoice,
	Popover,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import ManageLocations from './manage-locations';
import AddMenu from '../add-menu';

export default function Header( {
	menus,
	selectedMenuId,
	onSelectMenu,
	isPending,
	navigationPost,
} ) {
	const [ isAddNewMenuModalVisible, setIsAddNewModalVisible ] = useState(
		false
	);
	const selectedMenu = find( menus, { id: selectedMenuId } );
	const menuName = selectedMenu ? selectedMenu.name : undefined;
	let actionHeaderText;

	if ( menuName ) {
		actionHeaderText = sprintf(
			// translators: Name of the menu being edited, e.g. 'Main Menu'.
			__( 'Editing: %s' ),
			menuName
		);
	} else if ( isPending ) {
		// Loading text won't be displayed if menus are preloaded.
		actionHeaderText = __( 'Loading …' );
	} else {
		actionHeaderText = __( 'No menus available' );
	}

	const hasMenus = !! menus?.length;

	return (
		<div className="edit-navigation-header">
			<div className="edit-navigation-header__title-subtitle">
				<h1 className="edit-navigation-header__title">
					{ __( 'Navigation' ) }
				</h1>
				<h2 className="edit-navigation-header__subtitle">
					{ hasMenus && actionHeaderText }
				</h2>
			</div>
			{ hasMenus && (
				<div className="edit-navigation-header__actions">
					<DropdownMenu
						icon={ null }
						toggleProps={ {
							showTooltip: false,
							children: __( 'Switch menu' ),
							isTertiary: true,
							disabled: ! menus?.length,
							__experimentalIsFocusable: true,
						} }
						popoverProps={ {
							className:
								'edit-navigation-header__menu-selection-dropdown',
							position: 'bottom left',
						} }
					>
						{ ( { onClose } ) => (
							<>
								<MenuGroup>
									<MenuItemsChoice
										value={ selectedMenuId }
										onSelect={ ( menuId ) => {
											onSelectMenu( menuId );
											onClose();
										} }
										choices={ menus.map( ( menu ) => ( {
											value: menu.id,
											label: menu.name,
										} ) ) }
									/>
								</MenuGroup>
								<MenuGroup hideSeparator>
									<MenuItem
										isPrimary
										onClick={ () =>
											setIsAddNewModalVisible( true )
										}
									>
										{ __( 'Create a new menu' ) }
									</MenuItem>
									{ isAddNewMenuModalVisible && (
										<Modal
											title={ __( 'Create a new menu' ) }
											onRequestClose={ () =>
												setIsAddNewModalVisible( false )
											}
										>
											<AddMenu
												className="edit-navigation-header__add-menu"
												menus={ menus }
												onCreate={ ( menuId ) => {
													setIsAddNewModalVisible(
														false
													);
													onClose();
													onSelectMenu( menuId );
												} }
												helpText={ __(
													'A short descriptive name for your menu.'
												) }
											/>
										</Modal>
									) }
								</MenuGroup>
							</>
						) }
					</DropdownMenu>

					<Dropdown
						contentClassName="edit-navigation-header__manage-locations"
						position="bottom left"
						renderToggle={ ( { isOpen, onToggle } ) => (
							<Button
								isTertiary
								aria-expanded={ isOpen }
								onClick={ onToggle }
							>
								{ __( 'Manage locations' ) }
							</Button>
						) }
						renderContent={ () => <ManageLocations /> }
					/>

					<SaveButton navigationPost={ navigationPost } />

					<Popover.Slot name="block-toolbar" />
				</div>
			) }
		</div>
	);
}
