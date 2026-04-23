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

function getSuccessMessage( count: number, nextStatus: 'publish' | 'draft' ) {
	if ( count === 1 ) {
		return nextStatus === 'publish'
			? __( 'Taxonomy activated.' )
			: __( 'Taxonomy deactivated.' );
	}
	if ( nextStatus === 'publish' ) {
		return sprintf(
			/* translators: %d: The number of taxonomies. */
			_n( '%d taxonomy activated.', '%d taxonomies activated.', count ),
			count
		);
	}
	return sprintf(
		/* translators: %d: The number of taxonomies. */
		_n( '%d taxonomy deactivated.', '%d taxonomies deactivated.', count ),
		count
	);
}

const toggleActiveAction: Action< TaxonomyFormData > = {
	id: 'toggle-active',
	label: ( items: TaxonomyFormData[] ) =>
		items.every( ( i ) => i.status === 'publish' )
			? __( 'Deactivate' )
			: __( 'Activate' ),
	supportsBulk: true,
	async callback( items, { registry } ) {
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		const nextStatus = items.every( ( i ) => i.status === 'publish' )
			? 'draft'
			: 'publish';
		const itemsToUpdate = items.filter( ( item ) => item.id !== undefined );
		const promiseResult = await Promise.allSettled(
			itemsToUpdate.map( ( item ) =>
				saveEntityRecord(
					'postType',
					'wp_user_taxonomy',
					{ id: item.id, status: nextStatus },
					{ throwOnError: true }
				)
			)
		);
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			createSuccessNotice(
				getSuccessMessage( itemsToUpdate.length, nextStatus ),
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
					errorMessage = __( 'Failed to update taxonomy status.' );
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
					errorMessage = __( 'Failed to update taxonomies status.' );
				} else if ( errorMessages.size === 1 ) {
					errorMessage = sprintf(
						/* translators: %s: an error message */
						__(
							'An error occurred while updating the taxonomy status: %s'
						),
						[ ...errorMessages ][ 0 ]
					);
				} else {
					errorMessage = sprintf(
						/* translators: %s: a list of comma separated error messages */
						__(
							'Some errors occurred while updating the taxonomies status: %s'
						),
						[ ...errorMessages ].join( ',' )
					);
				}
			}
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	},
};

export default toggleActiveAction;
