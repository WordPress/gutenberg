/**
 * WordPress dependencies
 */
import { external, trash, backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export const trashPostAction = {
	id: 'move-to-trash',
	label: __( 'Move to Trash' ),
	isPrimary: true,
	icon: trash,
	isEligible( { status } ) {
		return status !== 'trash';
	},
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items: posts, closeModal, onPerform } ) => {
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const { deleteEntityRecord } = useDispatch( coreStore );
		return (
			<VStack spacing="5">
				<Text>
					{ posts.length === 1
						? sprintf(
								// translators: %s: The page's title.
								__( 'Are you sure you want to delete "%s"?' ),
								decodeEntities( posts[ 0 ].title.rendered )
						  )
						: sprintf(
								// translators: %d: The number of pages (2 or more).
								__(
									'Are you sure you want to delete %d pages?'
								),
								posts.length
						  ) }
				</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							const promiseResult = await Promise.allSettled(
								posts.map( ( post ) => {
									return deleteEntityRecord(
										'postType',
										post.type,
										post.id,
										{},
										{ throwOnError: true }
									);
								} )
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
										/* translators: The posts's title. */
										__( '"%s" moved to the Trash.' ),
										decodeEntities(
											posts[ 0 ].title.rendered
										)
									);
								} else {
									successMessage = __(
										'Pages moved to the Trash.'
									);
								}
								createSuccessNotice( successMessage, {
									type: 'snackbar',
									id: 'edit-site-page-trashed',
								} );
							} else {
								// If there was at lease one failure.
								let errorMessage;
								// If we were trying to move a single post to the trash.
								if ( promiseResult.length === 1 ) {
									if ( promiseResult[ 0 ].reason?.message ) {
										errorMessage =
											promiseResult[ 0 ].reason.message;
									} else {
										errorMessage = __(
											'An error occurred while moving the post to the trash.'
										);
									}
									// If we were trying to move multiple posts to the trash
								} else {
									const errorMessages = new Set();
									const failedPromises = promiseResult.filter(
										( { status } ) => status === 'rejected'
									);
									for ( const failedPromise of failedPromises ) {
										if ( failedPromise.reason?.message ) {
											errorMessages.add(
												failedPromise.reason.message
											);
										}
									}
									if ( errorMessages.size === 0 ) {
										errorMessage = __(
											'An error occurred while moving the posts to the trash.'
										);
									} else if ( errorMessages.size === 1 ) {
										errorMessage = sprintf(
											/* translators: %s: an error message */
											__(
												'An error occurred while moving the posts to the trash: %s'
											),
											[ ...errorMessages ][ 0 ]
										);
									} else {
										errorMessage = sprintf(
											/* translators: %s: a list of comma separated error messages */
											__(
												'Some errors occurred while moving the pages to the trash: %s'
											),
											[ ...errorMessages ].join( ',' )
										);
									}
									createErrorNotice( errorMessage, {
										type: 'snackbar',
									} );
								}
							}
							if ( onPerform ) {
								onPerform();
							}
							closeModal();
						} }
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export function usePermanentlyDeletePostAction() {
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { deleteEntityRecord } = useDispatch( coreStore );

	return useMemo(
		() => ( {
			id: 'permanently-delete',
			label: __( 'Permanently delete' ),
			isPrimary: true,
			icon: trash,
			supportsBulk: true,
			isEligible( { status } ) {
				return status === 'trash';
			},
			async callback( posts ) {
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
				if (
					promiseResult.every(
						( { status } ) => status === 'fulfilled'
					)
				) {
					let successMessage;
					if ( promiseResult.length === 1 ) {
						successMessage = sprintf(
							/* translators: The posts's title. */
							__( '"%s" permanently deleted.' ),
							decodeEntities( posts[ 0 ].title.rendered )
						);
					} else {
						successMessage = __(
							'The posts were permanently deleted.'
						);
					}
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'edit-site-post-permanently-deleted',
					} );
				} else {
					// If there was at lease one failure.
					let errorMessage;
					// If we were trying to permanently delete a single post.
					if ( promiseResult.length === 1 ) {
						if ( promiseResult[ 0 ].reason?.message ) {
							errorMessage = promiseResult[ 0 ].reason.message;
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
							if ( failedPromise.reason?.message ) {
								errorMessages.add(
									failedPromise.reason.message
								);
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
						createErrorNotice( errorMessage, {
							type: 'snackbar',
						} );
					}
				}
			},
		} ),
		[ createSuccessNotice, createErrorNotice, deleteEntityRecord ]
	);
}

export function useRestorePostAction() {
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );

	return useMemo(
		() => ( {
			id: 'restore',
			label: __( 'Restore' ),
			isPrimary: true,
			icon: backup,
			supportsBulk: true,
			isEligible( { status } ) {
				return status === 'trash';
			},
			async callback( posts ) {
				try {
					for ( const post of posts ) {
						await editEntityRecord(
							'postType',
							post.type,
							post.id,
							{
								status: 'draft',
							}
						);
						await saveEditedEntityRecord(
							'postType',
							post.type,
							post.id,
							{ throwOnError: true }
						);
					}

					createSuccessNotice(
						posts.length > 1
							? sprintf(
									/* translators: The number of posts. */
									__( '%d posts have been restored.' ),
									posts.length
							  )
							: sprintf(
									/* translators: The number of posts. */
									__( '"%s" has been restored.' ),
									decodeEntities( posts[ 0 ].title.rendered )
							  ),
						{
							type: 'snackbar',
							id: 'edit-site-post-restored',
						}
					);
				} catch ( error ) {
					let errorMessage;
					if (
						error.message &&
						error.code !== 'unknown_error' &&
						error.message
					) {
						errorMessage = error.message;
					} else if ( posts.length > 1 ) {
						errorMessage = __(
							'An error occurred while restoring the posts.'
						);
					} else {
						errorMessage = __(
							'An error occurred while restoring the post.'
						);
					}

					createErrorNotice( errorMessage, { type: 'snackbar' } );
				}
			},
		} ),
		[
			createSuccessNotice,
			createErrorNotice,
			editEntityRecord,
			saveEditedEntityRecord,
		]
	);
}

export const viewPostAction = {
	id: 'view-post',
	label: __( 'View' ),
	isPrimary: true,
	icon: external,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts ) {
		const post = posts[ 0 ];
		document.location.href = post.link;
	},
};

export function useEditPostAction() {
	const history = useHistory();
	return useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			isEligible( { status } ) {
				return status !== 'trash';
			},
			callback( posts ) {
				const post = posts[ 0 ];
				history.push( {
					postId: post.id,
					postType: post.type,
					canvas: 'edit',
				} );
			},
		} ),
		[ history ]
	);
}
export const postRevisionsAction = {
	id: 'view-post-revisions',
	label: __( 'View revisions' ),
	isPrimary: false,
	isEligible: ( post ) => {
		if ( post.status === 'trash' ) {
			return false;
		}
		const lastRevisionId =
			post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
		const revisionsCount =
			post?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return lastRevisionId && revisionsCount > 1;
	},
	callback( posts ) {
		const post = posts[ 0 ];
		const href = addQueryArgs( 'revision.php', {
			revision: post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id,
		} );
		document.location.href = href;
	},
};
