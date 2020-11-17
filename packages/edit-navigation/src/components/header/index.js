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
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ManageLocations from './manage-locations';
import AddMenuForm from './add-menu-form';

export default function Header( {
	menus,
	selectedMenuId,
	onSelectMenu,
	isPending,
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

	return (
		<div className="edit-navigation-header">
			<h1 className="edit-navigation-header__title">
				{ __( 'Navigation' ) }
			</h1>

			<div className="edit-navigation-header__actions">
				<h2 className="edit-navigation-header__action_header">
					{ actionHeaderText }
				</h2>

				<DropdownMenu
					icon={ null }
					toggleProps={ {
						showTooltip: false,
						children: __( 'Select menu' ),
						isTertiary: true,
						disabled: ! menus,
						__experimentalIsFocusable: true,
					} }
					popoverProps={ {
						position: 'bottom center',
					} }
				>
					{ () => (
						<MenuGroup>
							<MenuItemsChoice
								value={ selectedMenuId }
								onSelect={ onSelectMenu }
								choices={ menus.map( ( menu ) => ( {
									value: menu.id,
									label: menu.name,
								} ) ) }
							/>
						</MenuGroup>
					) }
				</DropdownMenu>

				<Dropdown
					position="bottom center"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							isTertiary
							aria-expanded={ isOpen }
							onClick={ onToggle }
						>
							{ __( 'Add new' ) }
						</Button>
					) }
					renderContent={ () => (
						<AddMenuForm
							menus={ menus }
							onCreate={ onSelectMenu }
						/>
					) }
				/>

				<Dropdown
					contentClassName="edit-navigation-header__manage-locations"
					position="bottom center"
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
			</div>
		</div>
	);
}
