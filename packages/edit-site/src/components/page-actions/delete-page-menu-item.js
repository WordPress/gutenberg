/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import {
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';

export default function DeletePageMenuItem( { postId, onRemove } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { deleteEntityRecord } = useDispatch( coreStore );
	const page = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'postType', 'page', postId ),
		[ postId ]
	);
	async function removePage() {
		try {
			await deleteEntityRecord(
				'postType',
				'page',
				postId,
				{},
				{ throwOnError: true }
			);
			createSuccessNotice(
				sprintf(
					/* translators: The page's title. */
					__( '"%s" deleted.' ),
					decodeEntities( page.title.rendered )
				),
				{
					type: 'snackbar',
					id: 'edit-site-page-removed',
				}
			);
			onRemove?.();
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while deleting the page.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			setIsModalOpen( false );
		}
	}
	return (
		<>
			<MenuItem onClick={ () => setIsModalOpen( true ) } isDestructive>
				{ __( 'Delete' ) }
			</MenuItem>
			<ConfirmDialog
				isOpen={ isModalOpen }
				onConfirm={ removePage }
				onCancel={ () => setIsModalOpen( false ) }
				confirmButtonText={ __( 'Delete' ) }
			>
				{ __( 'Are you sure you want to delete this page?' ) }
			</ConfirmDialog>
		</>
	);
}
