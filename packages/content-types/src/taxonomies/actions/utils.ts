/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { Action } from '@wordpress/dataviews';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { CoreDataError, TaxonomyFormData } from '../types';
import { TAXONOMY_ENTITY } from '../../constants';

type Status = TaxonomyFormData[ 'status' ];

export interface StatusActionConfig {
	id: string;
	label: string;
	targetStatus: Status;
	messages: {
		successSingle: string;
		successMany: ( count: number ) => string;
		failSingle: string;
		failMany: string;
		errorSingle: ( message: string ) => string;
		errorMany: ( messages: string ) => string;
	};
}

export function createStatusAction(
	config: StatusActionConfig
): Action< TaxonomyFormData > {
	const isEligible = ( item: TaxonomyFormData ) =>
		item.status !== config.targetStatus;
	return {
		id: config.id,
		label: config.label,
		supportsBulk: true,
		isEligible,
		async callback( items, { registry } ) {
			const itemsToUpdate = items.filter( isEligible );
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
						TAXONOMY_ENTITY,
						{ id: item.id, status: config.targetStatus },
						{ throwOnError: true }
					)
				)
			);
			if (
				promiseResult.every( ( { status } ) => status === 'fulfilled' )
			) {
				createSuccessNotice(
					itemsToUpdate.length === 1
						? config.messages.successSingle
						: config.messages.successMany( itemsToUpdate.length ),
					{ type: 'snackbar' }
				);
				return;
			}
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
					errorMessage = config.messages.failSingle;
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
					errorMessage = config.messages.failMany;
				} else if ( errorMessages.size === 1 ) {
					errorMessage = config.messages.errorSingle(
						[ ...errorMessages ][ 0 ]
					);
				} else {
					errorMessage = config.messages.errorMany(
						[ ...errorMessages ].join( ',' )
					);
				}
			}
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		},
	};
}
