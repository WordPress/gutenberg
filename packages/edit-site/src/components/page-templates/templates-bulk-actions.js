/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { DataTableBulkActions } from '../datatable';

export default function TemplatesBulkActions( { anchor } ) {
	// What happens if one of the selected rows can be deleted and the other one can be reset?
	return (
		<DataTableBulkActions anchor={ anchor }>
			<Button>{ __( 'Some action..' ) }</Button>
		</DataTableBulkActions>
	);
}
