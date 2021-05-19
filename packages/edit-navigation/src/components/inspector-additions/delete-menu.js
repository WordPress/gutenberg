/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function DeleteMenu( { onDeleteMenu, isMenuBeingDeleted } ) {
	return (
		<Button
			className="edit-navigation-inspector-additions__delete-menu-button"
			isSecondary
			isDestructive
			isBusy={ isMenuBeingDeleted }
			onClick={ () => {
				if (
					// eslint-disable-next-line no-alert
					window.confirm(
						__(
							'Are you sure you want to delete this navigation? This action cannot be undone.'
						)
					)
				) {
					onDeleteMenu();
				}
			} }
		>
			{ __( 'Delete menu' ) }
		</Button>
	);
}
