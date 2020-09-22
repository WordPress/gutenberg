/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MenuSelector from './menu-selector';
import ManageLocations from './manage-locations';
import AddMenuForm from './add-menu-form';

export default function Header( { menus, selectedMenuId, onSelectMenu } ) {
	const selectedMenu = find( menus, { id: selectedMenuId } );
	const menuName = selectedMenu ? selectedMenu.name : undefined;

	return (
		<div className="edit-navigation-header">
			<h1 className="edit-navigation-header__title">
				{ __( 'Navigation' ) }
			</h1>

			<div className="edit-navigation-header__status_bar">
				{ menuName && (
					<h2 className="edit-navigation-header__status_header">
						{ sprintf(
							// translators: Name of the menu being edited, e.g. 'Main Menu'.
							__( 'Currently editing: %s' ),
							menuName
						) }
					</h2>
				) }

				<div className="edit-navigation-header__actions">
					<MenuSelector
						menus={ menus }
						activeMenuId={ selectedMenuId }
						onSelectMenu={ onSelectMenu }
					/>

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
		</div>
	);
}
