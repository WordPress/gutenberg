/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { Action } from '@wordpress/dataviews';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { ContentType, CoreDataError } from '../types';

export interface StatusActionConfig {
	id: string;
	label: string;
	entity: string;
	targetStatus: ContentType[ 'status' ];
	messages: {
		successSingle: string;
		successMany: ( count: number ) => string;
		failSingle: string;
		failMany: string;
		errorSingle: ( message: string ) => string;
		errorMany: ( messages: string ) => string;
	};
}

export function createStatusAction< T extends ContentType >(
	config: StatusActionConfig
): Action< T > {
	const isEligible = ( item: T ) => item.status !== config.targetStatus;
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
						config.entity,
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
