/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { Action } from '@wordpress/dataviews';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { CoreDataError, TaxonomyFormData } from '../types';

const deactivateAction: Action< TaxonomyFormData > = {
	id: 'deactivate',
	label: __( 'Deactivate' ),
	supportsBulk: true,
	isEligible: ( item ) => item.status === 'publish',
	async callback( items, { registry } ) {
		const itemsToUpdate = items.filter(
			( item ) => item.id !== undefined && item.status === 'publish'
		);
		if ( itemsToUpdate.length === 0 ) {
			return;
		}
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		const promiseResult = await Promise.allSettled(
			itemsToUpdate.map( ( item ) =>
				saveEntityRecord(
					'postType',
					'wp_user_taxonomy',
					{ id: item.id, status: 'draft' },
					{ throwOnError: true }
				)
			)
		);
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			createSuccessNotice(
				itemsToUpdate.length === 1
					? __( 'Taxonomy deactivated.' )
					: sprintf(
							/* translators: %d: The number of taxonomies. */
							_n(
								'%d taxonomy deactivated.',
								'%d taxonomies deactivated.',
								itemsToUpdate.length
							),
							itemsToUpdate.length
					  ),
				{ type: 'snackbar' }
			);
		} else {
			let errorMessage;
			if ( promiseResult.length === 1 ) {
				const typedError = promiseResult[ 0 ] as {
					reason?: CoreDataError;
				};
				if (
					typedError.reason?.message &&
					typedError.reason.code !== 'unknown_error'
				) {
					errorMessage = typedError.reason.message;
				} else {
					errorMessage = __( 'Failed to deactivate taxonomy.' );
				}
			} else {
				const errorMessages = new Set< string >();
				const failedPromises = promiseResult.filter(
					( { status } ) => status === 'rejected'
				);
				for ( const failedPromise of failedPromises ) {
					const typedError = failedPromise as {
						reason?: CoreDataError;
					};
					if (
						typedError.reason?.message &&
						typedError.reason.code !== 'unknown_error'
					) {
						errorMessages.add( typedError.reason.message );
					}
				}
				if ( errorMessages.size === 0 ) {
					errorMessage = __( 'Failed to deactivate taxonomies.' );
				} else if ( errorMessages.size === 1 ) {
					errorMessage = sprintf(
						/* translators: %s: an error message */
						__(
							'An error occurred while deactivating the taxonomy: %s'
						),
						[ ...errorMessages ][ 0 ]
					);
				} else {
					errorMessage = sprintf(
						/* translators: %s: a list of comma separated error messages */
						__(
							'Some errors occurred while deactivating the taxonomies: %s'
						),
						[ ...errorMessages ].join( ',' )
					);
				}
			}
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	},
};

export default deactivateAction;
