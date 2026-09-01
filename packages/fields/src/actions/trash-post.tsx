import { trash } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { Action } from '@wordpress/dataviews';
import { getItemTitle } from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

const trashPost: Action< PostWithPermissions > = {
	id: 'move-to-trash',
	label: _x( 'Trash', 'verb' ),
	isPrimary: true,
	icon: trash,
	isEligible( item ) {
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
			item.permissions?.delete
		);
	},
	supportsBulk: true,
	async callback( items, { registry, onActionPerformed } ) {
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
			} );
			if ( onActionPerformed ) {
				onActionPerformed( items );
			}
		} else {
			let errorMessage;
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
	},
};

/**
 * Trash action for PostWithPermissions.
 */
export default trashPost;
