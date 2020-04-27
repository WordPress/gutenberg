/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function MenuDelete( { menuId, onDelete } ) {
	const deleteMenu = async ( recordId ) => {
		const path = `${ '/__experimental/menus/' + recordId + '?force=true' }`;
		const deletedRecord = await apiFetch( {
			path,
			method: 'DELETE',
		} );
		return deletedRecord.previous;
	};

	const askToDelete = async () => {
		if (
			// eslint-disable-next-line no-alert
			window.confirm( __( 'Are you sure you want to delete this menu?' ) )
		) {
			const deletedMenu = await deleteMenu( menuId );
			onDelete( deletedMenu );
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
