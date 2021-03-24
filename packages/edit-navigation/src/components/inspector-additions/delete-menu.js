/**
 * WordPress dependencies
 */
import { PanelBody, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function DeleteMenu( { onDeleteMenu } ) {
	return (
		<PanelBody className="edit-navigation-inspector-additions__delete-menu-panel">
			<Button
				isLink
				isDestructive
				onClick={ () => {
					if (
						// eslint-disable-next-line no-alert
						window.confirm(
							__(
								'Are you sure you want to delete this navigation?'
							)
						)
					) {
						onDeleteMenu();
					}
				} }
			>
				{ __( 'Delete menu' ) }
			</Button>
		</PanelBody>
	);
}
