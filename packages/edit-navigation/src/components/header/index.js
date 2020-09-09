/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Dropdown } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ManageLocations from './manage-locations';

export default function Header( { onBeginAddingMenu } ) {
	return (
		<div className="edit-navigation-header">
			<h1>{ __( 'Navigation' ) }</h1>

			<Button
				className="edit-navigation-header__add-new-button"
				isSecondary
				onClick={ onBeginAddingMenu }
			>
				{ __( 'Add new' ) }
			</Button>

			<Dropdown
				contentClassName="edit-navigation-header__manage-locations"
				position="bottom center"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						isLink
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ __( 'Manage locations' ) }
					</Button>
				) }
				renderContent={ () => <ManageLocations /> }
			/>
		</div>
	);
}
