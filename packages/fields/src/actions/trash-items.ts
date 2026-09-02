import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getItemTitle } from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

/**
 * Whether the item can be moved to the trash.
 *
 * @param item The item to check.
 * @return Whether the item can be moved to the trash.
 */
export function canTrash( item: PostWithPermissions ) {
	if ( item.type === 'wp_template_part' || item.type === 'wp_block' ) {
		return false;
	}

	// Non-database template cannot be trashed.
	if ( item.type === 'wp_template' && typeof item.id === 'string' ) {
		return false;
	}

	return (
		!! item.status &&
		! [ 'auto-draft', 'trash' ].includes( item.status ) &&
		!! item.permissions?.delete
	);
}

interface TrashItemsOptions {
	registry: any;
	onActionPerformed?: ( items: PostWithPermissions[] ) => void;
	/**
	 * Extra options for the success notice, such as an Undo action.
	 */
	successNoticeOptions?: Record< string, unknown >;
}

/**
 * Moves the items to the trash and announces the outcome with a snackbar.
 *
 * @param items                        The items to move to the trash.
 * @param options                      Options.
 * @param options.registry             The data registry.
 * @param options.onActionPerformed    Callback run once the items have been
 *                                     processed.
 * @param options.successNoticeOptions Extra options for the success notice,
 *                                     such as an Undo action.
 */
export async function trashItems(
	items: PostWithPermissions[],
	{ registry, onActionPerformed, successNoticeOptions }: TrashItemsOptions
) {
	const { createSuccessNotice, createErrorNotice } =
		registry.dispatch( noticesStore );
	const { deleteEntityRecord } = registry.dispatch( coreStore );
	const promiseResult = await Promise.allSettled(
		items.map( ( item ) =>
			deleteEntityRecord(
				'postType',
				item.type,
				item.id.toString(),
				{},
				{ throwOnError: true }
			)
		)
	);
	// If all the promises were fulfilled with success.
	if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
		let successMessage;
		if ( promiseResult.length === 1 ) {
			successMessage = sprintf(
				/* translators: %s: The item's title. */
				__( '"%s" moved to the trash.' ),
				getItemTitle( items[ 0 ] )
			);
		} else {
			successMessage = sprintf(
				/* translators: %d: The number of items. */
				_n(
					'%d item moved to the trash.',
					'%d items moved to the trash.',
					items.length
				),
				items.length
			);
		}
		createSuccessNotice( successMessage, {
			type: 'snackbar',
			id: 'move-to-trash-action',
			...successNoticeOptions,
		} );
	} else {
		// If there was at least one failure.
		let errorMessage;
		// If we were trying to delete a single item.
		if ( promiseResult.length === 1 ) {
			const typedError = promiseResult[ 0 ] as {
				reason?: CoreDataError;
			};
			if ( typedError.reason?.message ) {
				errorMessage = typedError.reason.message;
			} else {
				errorMessage = __(
					'An error occurred while moving the item to the trash.'
				);
			}
			// If we were trying to delete multiple items.
		} else {
			const errorMessages = new Set< string >();
			const failedPromises = promiseResult.filter(
				( { status } ) => status === 'rejected'
			);
			for ( const failedPromise of failedPromises ) {
				const typedError = failedPromise as {
					reason?: CoreDataError;
				};
				if ( typedError.reason?.message ) {
					errorMessages.add( typedError.reason.message );
				}
			}
			if ( errorMessages.size === 0 ) {
				errorMessage = __(
					'An error occurred while moving the items to the trash.'
				);
			} else if ( errorMessages.size === 1 ) {
				errorMessage = sprintf(
					/* translators: %s: an error message */
					__(
						'An error occurred while moving the item to the trash: %s'
					),
					[ ...errorMessages ][ 0 ]
				);
			} else {
				errorMessage = sprintf(
					/* translators: %s: a list of comma separated error messages */
					__(
						'Some errors occurred while moving the items to the trash: %s'
					),
					[ ...errorMessages ].join( ',' )
				);
			}
		}
		createErrorNotice( errorMessage, {
			type: 'snackbar',
		} );
	}
	if ( onActionPerformed ) {
		onActionPerformed( items );
	}
}
