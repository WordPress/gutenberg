/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

export default function SaveButton( ) {
	return (
		<Button
			className="edit-navigation-toolbar__save-button"
			variant="primary"
		>
			{ __( 'Save' ) }
		</Button>
	);
}
