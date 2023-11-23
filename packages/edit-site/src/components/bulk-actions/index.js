/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export function useBulkTrashPostAction() {
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { deleteEntityRecord } = useDispatch( coreStore );
	return useMemo(
		() => ( {
			id: 'move-to-trash',
			label: __( 'Move to Trash' ),
			isPrimary: true,
			icon: trash,
			isEligible( data, selection ) {
				console.log( {
					p: data.filter( ( post ) => selection.includes( post.id ) ),
				} );
				return ! data
					.filter( ( post ) => selection.includes( post.id ) )
					.some( ( post ) => post.status === 'trash' );
			},
			async callback( data, selection ) {
				const postsToDelete = data.filter( ( post ) =>
					selection.includes( post.id )
				);
				try {
					await Promise.all(
						postsToDelete.map( async ( post ) => {
							deleteEntityRecord(
								'postType',
								post.type,
								post.id,
								{},
								{ throwOnError: true }
							);
						} )
					);
					createSuccessNotice(
						__( 'The selected posts were moved to the trash.' ),
						{
							type: 'snackbar',
							id: 'edit-site-page-trashed',
						}
					);
				} catch ( error ) {
					const errorMessage =
						error.message && error.code !== 'unknown_error'
							? error.message
							: __(
									'An error occurred while moving the posts to the trash.'
							  );

					createErrorNotice( errorMessage, { type: 'snackbar' } );
				}
			},
		} ),
		[ createErrorNotice, createSuccessNotice, deleteEntityRecord ]
	);
}
