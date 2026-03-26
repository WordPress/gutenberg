/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { Action } from '@wordpress/dataviews';
import { trash } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { getItemTitle, isTemplateOrTemplatePart } from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

const permanentlyDeletePost: Action< PostWithPermissions > = {
	id: 'permanently-delete',
	label: __( 'Permanently delete' ),
	supportsBulk: true,
	icon: trash,
	isEligible( item ) {
		if ( isTemplateOrTemplatePart( item ) || item.type === 'wp_block' ) {
			return false;
		}
		const { status, permissions } = item;
		return status === 'trash' && permissions?.delete;
	},
	hideModalHeader: true,
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const { deleteEntityRecord } = useDispatch( coreStore );

		return (
			<VStack spacing="5">
				<Text>
					{ items.length > 1
						? sprintf(
								// translators: %d: number of items to delete.
								_n(
									'Are you sure you want to permanently delete %d item?',
									'Are you sure you want to permanently delete %d items?',
									items.length
								),
								items.length
						  )
						: sprintf(
								// translators: %s: The post's title
								__(
									'Are you sure you want to permanently delete "%s"?'
								),
								decodeEntities( getItemTitle( items[ 0 ] ) )
						  ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							const promiseResult = await Promise.allSettled(
								items.map( ( post ) =>
									deleteEntityRecord(
										'postType',
										post.type,
										post.id,
										{ force: true },
										{ throwOnError: true }
									)
								)
							);

							// If all the promises were fulfilled with success.
							if (
								promiseResult.every(
									( { status } ) => status === 'fulfilled'
								)
							) {
								let successMessage;
								if ( promiseResult.length === 1 ) {
									successMessage = sprintf(
										/* translators: %s: The posts's title. */
										__( '"%s" permanently deleted.' ),
										getItemTitle( items[ 0 ] )
									);
								} else {
									successMessage = __(
										'The items were permanently deleted.'
									);
								}
								createSuccessNotice( successMessage, {
									type: 'snackbar',
									id: 'permanently-delete-post-action',
								} );
								onActionPerformed?.( items );
							} else {
								// If there was at lease one failure.
								let errorMessage;
								// If we were trying to permanently delete a single post.
								if ( promiseResult.length === 1 ) {
									const typedError = promiseResult[ 0 ] as {
										reason?: CoreDataError;
									};
									if ( typedError.reason?.message ) {
										errorMessage =
											typedError.reason.message;
									} else {
										errorMessage = __(
											'An error occurred while permanently deleting the item.'
										);
									}
									// If we were trying to permanently delete multiple posts
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
											errorMessages.add(
												typedError.reason.message
											);
										}
									}
									if ( errorMessages.size === 0 ) {
										errorMessage = __(
											'An error occurred while permanently deleting the items.'
										);
									} else if ( errorMessages.size === 1 ) {
										errorMessage = sprintf(
											/* translators: %s: an error message */
											__(
												'An error occurred while permanently deleting the items: %s'
											),
											[ ...errorMessages ][ 0 ]
										);
									} else {
										errorMessage = sprintf(
											/* translators: %s: a list of comma separated error messages */
											__(
												'Some errors occurred while permanently deleting the items: %s'
											),
											[ ...errorMessages ].join( ',' )
										);
									}
								}
								createErrorNotice( errorMessage, {
									type: 'snackbar',
								} );
							}

							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ __( 'Delete permanently' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

/**
 * Delete action for PostWithPermissions.
 */
export default permanentlyDeletePost;
