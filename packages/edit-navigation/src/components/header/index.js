/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dropdown, DropdownMenu, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import ManageLocations from './manage-locations';
import MenuSwitcher from '../menu-switcher';

export default function Header( {
	menus,
	selectedMenuId,
	onSelectMenu,
	isPending,
	navigationPost,
} ) {
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
							children: __( 'Switch menu' ),
							'aria-label': __(
								'Switch menu, or create a new menu'
							),
							showTooltip: false,
							isTertiary: true,
							disabled: ! menus?.length,
							__experimentalIsFocusable: true,
						} }
						popoverProps={ {
							className:
								'edit-navigation-header__menu-switcher-dropdown',
							position: 'bottom left',
						} }
					>
						{ ( { onClose } ) => (
							<MenuSwitcher
								menus={ menus }
								selectedMenuId={ selectedMenuId }
								onSelectMenu={ ( menuId ) => {
									onSelectMenu( menuId );
									onClose();
								} }
							/>
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
						renderContent={ () => (
							<ManageLocations menus={ menus } />
						) }
					/>

					<SaveButton navigationPost={ navigationPost } />

					<Popover.Slot name="block-toolbar" />
				</div>
			) }
		</div>
	);
}
