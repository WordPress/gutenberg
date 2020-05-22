/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function DeleteMenuButton( { onDelete } ) {
	const askToDelete = async () => {
		if (
			// eslint-disable-next-line no-alert
			window.confirm(
				__( 'Are you sure you want to delete this navigation?' )
			)
		) {
			onDelete();
		}
	};

	return (
		<Button
			className="menu-editor-button__delete"
			isPrimary
			onClick={ askToDelete }
			isLink
		>
			{ __( 'Delete navigation' ) }
		</Button>
	);
}
