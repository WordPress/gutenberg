/**
 * WordPress dependencies
 */
import {
	Button,
	Popover,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { sprintf, __, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDataTableContext } from './context';

export default function DataTableBulkActions( { anchor, children } ) {
	const table = useDataTableContext();
	// TODO: probably will need to reset the selection on various actions or just in `data` change..
	const selectedRows = table.getSelectedRowModel().flatRows;
	// TODO: if not children and fills, do not render..
	// const fills = useSlotFills( DATATABLE_BULK_ACTIONS_SLOT_NAME );
	// if ( ! selectedRows.length || ! fills?.length ) {
	// 	return null;
	// }
	if ( ! selectedRows.length ) {
		return null;
	}
	return (
		<Popover
			anchor={ anchor }
			placement="bottom"
			focusOnMount={ false }
			className="datatable-bulk-actions__popover"
		>
			<HStack justify="flex-start" spacing={ 3 }>
				<Text variant="muted">
					{
						// translators: %s: Total number of selected entries.
						sprintf(
							// translators: %s: Total number of selected entries.
							_n( '%s item', '%s items', selectedRows.length ),
							selectedRows.length
						)
					}
				</Text>
				{ children }
				<Button onClick={ () => table.resetRowSelection() }>
					{ __( 'Deselect' ) }
				</Button>
			</HStack>
		</Popover>
	);
}
