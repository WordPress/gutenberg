/**
 * WordPress dependencies
 */
import { Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function DeletedNavigationWarning( { onCreateNew } ) {
	return (
		<Warning>
			{ __( 'Navigation menu has been deleted or is unavailable. ' ) }
			<Button onClick={ onCreateNew } variant="link">
				{ __( 'Create a new menu?' ) }
			</Button>
		</Warning>
	);
}

export default DeletedNavigationWarning;
