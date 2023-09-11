/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { DataTableBulkActions, useDataTableContext } from '../datatable';
import PagesListBulkActions from './pages-bulk-actions-slot';

export default function PagesBulkActions( { anchor } ) {
	// Extenders can add extra bulk actions through `registerPlugin`.
	return (
		<DataTableBulkActions anchor={ anchor }>
			<DeleteMenuItem />
			<PagesListBulkActions.Slot />
		</DataTableBulkActions>
	);
}

function DeleteMenuItem( { onRemove } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const table = useDataTableContext();
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { deleteEntityRecord } = useDispatch( coreStore );

	async function deletePages( items ) {
		const deletePromises = items.map( ( { original: { id, type } } ) =>
			deleteEntityRecord(
				'postType',
				type,
				id,
				{},
				{ throwOnError: true }
			)
		);
		const deleteRequests = await Promise.allSettled( deletePromises );
		if (
			deleteRequests.every( ( { status } ) => status === 'fulfilled' )
		) {
			createSuccessNotice( __( 'Selected pages successfully removed' ), {
				type: 'snackbar',
				id: 'pages-list-bulk-delete-success',
			} );
		}
		// At least a deletion has failed, so accumulate the results and display an
		// appropriate message. We'll probably need a custom promise that also has
		// the titles of entities that failed.
		// deleteRequests.forEach( ( ob ) => {
		// 	console.log( ob );
		// } );
	}
	return (
		<>
			<Button
				variant="primary"
				isDestructive
				onClick={ () => setIsModalOpen( true ) }
			>
				{ __( 'Delete' ) }
			</Button>
			<ConfirmDialog
				isOpen={ isModalOpen }
				onConfirm={ async () => {
					await deletePages( table.getSelectedRowModel().flatRows );
					setIsModalOpen( false );
					// TODO: check for better handling.. Stil not working on all cases(ex paging).
					table.options.meta.resetQuery(); // This can reset the query.
					table.reset(); // This resets the table's state.
					onRemove?.();
				} }
				onCancel={ () => setIsModalOpen( false ) }
				confirmButtonText={ __( 'Delete' ) }
			>
				{ __( 'Are you sure you want to delete the selected items?' ) }
			</ConfirmDialog>
		</>
	);
}
