/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SaveButton( { navigationPost, onSavePost } ) {
	return (
		<Button
			className="edit-navigation-toolbar__save-button"
			isPrimary
			onClick={ () => {
				onSavePost( navigationPost );
			} }
		>
			{ __( 'Save' ) }
		</Button>
	);
}
