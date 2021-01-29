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
	Popover,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import BlockInspectorDropdown from './block-inspector-dropdown';
import ManageLocations from './manage-locations';
import AddMenuForm from './add-menu-form';

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

	return (
		<div className="edit-navigation-header">
			<div className="edit-navigation-header__title-subtitle">
				<h1 className="edit-navigation-header__title">
					{ __( 'Navigation' ) }
				</h1>
				<h2 className="edit-navigation-header__subtitle">
					{ actionHeaderText }
				</h2>
			</div>
			<div className="edit-navigation-header__actions">
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
						position: 'bottom left',
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
					position="bottom left"
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

				<BlockInspectorDropdown />
				<Popover.Slot name="block-toolbar" />
			</div>
		</div>
	);
}
