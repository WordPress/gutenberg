/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';
import { trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ACTION_TYPES } from './constants';

export default function useTrashPostAction() {
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { deleteEntityRecord } = useDispatch( coreStore );

	return useMemo(
		() => ( {
			id: 'move-to-trash',
			label: __( 'Move to Trash' ),
			type: ACTION_TYPES.primary,
			icon: trash,
			isEligible( { status } ) {
				return status !== 'trash';
			},
			async perform( post ) {
				try {
					await deleteEntityRecord(
						'postType',
						post.type,
						post.id,
						{},
						{ throwOnError: true }
					);
					createSuccessNotice(
						sprintf(
							/* translators: The page's title. */
							__( '"%s" moved to the Trash.' ),
							decodeEntities( post.title.rendered )
						),
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
									'An error occurred while moving the page to the trash.'
							  );

					createErrorNotice( errorMessage, { type: 'snackbar' } );
				}
			},
			isDesctructive: true,
		} ),
		[ createSuccessNotice, createErrorNotice, deleteEntityRecord ]
	);
}
