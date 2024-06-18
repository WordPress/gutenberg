/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getItemTitle } from './utils';
import type { Post } from '../types';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../store/constants';

type CoreDataError = {
	reason: { message?: string };
};

const permanentlyDeletePostAction: Action< Post > = {
	id: 'permanently-delete',
	label: __( 'Permanently delete' ),
	supportsBulk: true,
	isEligible( { status, type }: Post ) {
		const isTemplateOrTemplatePart = [
			TEMPLATE_POST_TYPE,
			TEMPLATE_PART_POST_TYPE,
		].includes( type );

		return ! isTemplateOrTemplatePart && status === 'trash';
	},
	async callback( posts, { registry } ) {
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const promiseResult = await Promise.allSettled(
			posts.map( ( post ) => {
				return deleteEntityRecord(
					'postType',
					post.type,
					post.id,
					{ force: true },
					{ throwOnError: true }
				);
			} )
		);
		// If all the promises were fulfilled with success.
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			let successMessage;
			if ( promiseResult.length === 1 ) {
				successMessage = sprintf(
					/* translators: The posts's title. */
					__( '"%s" permanently deleted.' ),
					getItemTitle( posts[ 0 ] )
				);
			} else {
				successMessage = __( 'The posts were permanently deleted.' );
			}
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'permanently-delete-post-action',
			} );
		} else {
			// If there was at lease one failure.
			let errorMessage;
			// If we were trying to permanently delete a single post.
			if ( promiseResult.length === 1 ) {
				const result = promiseResult[ 0 ] as CoreDataError;
				if ( result.reason?.message ) {
					errorMessage = result.reason.message;
				} else {
					errorMessage = __(
						'An error occurred while permanently deleting the post.'
					);
				}
				// If we were trying to permanently delete multiple posts
			} else {
				const errorMessages = new Set();
				const failedPromises = promiseResult.filter(
					( { status } ) => status === 'rejected'
				);
				for ( const failedPromise of failedPromises ) {
					const result = failedPromise as CoreDataError;
					if ( result.reason?.message ) {
						errorMessages.add( result.reason.message );
					}
				}
				if ( errorMessages.size === 0 ) {
					errorMessage = __(
						'An error occurred while permanently deleting the posts.'
					);
				} else if ( errorMessages.size === 1 ) {
					errorMessage = sprintf(
						/* translators: %s: an error message */
						__(
							'An error occurred while permanently deleting the posts: %s'
						),
						[ ...errorMessages ][ 0 ]
					);
				} else {
					errorMessage = sprintf(
						/* translators: %s: a list of comma separated error messages */
						__(
							'Some errors occurred while permanently deleting the posts: %s'
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

export default permanentlyDeletePostAction;
