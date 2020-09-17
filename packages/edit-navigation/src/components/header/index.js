/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MenuSelector from './menu-selector';
import ManageLocations from './manage-locations';
import AddMenuForm from './add-menu-form';

export default function Header( { menus, selectedMenuId, onSelectMenu } ) {
	return (
		<div className="edit-navigation-header">
			<h1 className="edit-navigation-header__title">
				{ __( 'Navigation' ) }
			</h1>

			<div className="edit-navigation-header__actions">
				<div className="edit-navigation-header__current-menu">
					<MenuSelector
						menus={ menus }
						activeMenuId={ selectedMenuId }
						onSelectMenu={ onSelectMenu }
					/>
				</div>

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
