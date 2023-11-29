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
	hideModalHeader: true,
	RenderModal: ( { item: post, closeModal } ) => {
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const { deleteEntityRecord } = useDispatch( coreStore );
		return (
			<VStack spacing="5">
				<Text>
					{ sprintf(
						// translators: %s: The page's title.
						__( 'Are you sure you want to delete "%s"?' ),
						decodeEntities( post.title.rendered )
					) }
				</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
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
									error.message &&
									error.code !== 'unknown_error'
										? error.message
										: __(
												'An error occurred while moving the page to the trash.'
										  );

								createErrorNotice( errorMessage, {
									type: 'snackbar',
								} );
							}
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
			isEligible( { status } ) {
				return status === 'trash';
			},
			async callback( post ) {
				try {
					await deleteEntityRecord(
						'postType',
						post.type,
						post.id,
						{ force: true },
						{ throwOnError: true }
					);
					createSuccessNotice(
						sprintf(
							/* translators: The posts's title. */
							__( '"%s" permanently deleted.' ),
							decodeEntities( post.title.rendered )
						),
						{
							type: 'snackbar',
							id: 'edit-site-post-permanently-deleted',
						}
					);
				} catch ( error ) {
					const errorMessage =
						error.message && error.code !== 'unknown_error'
							? error.message
							: __(
									'An error occurred while permanently deleting the post.'
							  );

					createErrorNotice( errorMessage, { type: 'snackbar' } );
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
			isEligible( { status } ) {
				return status === 'trash';
			},
			async callback( post ) {
				await editEntityRecord( 'postType', post.type, post.id, {
					status: 'draft',
				} );
				try {
					await saveEditedEntityRecord(
						'postType',
						post.type,
						post.id,
						{ throwOnError: true }
					);
					createSuccessNotice(
						sprintf(
							/* translators: The posts's title. */
							__( '"%s" has been restored.' ),
							decodeEntities( post.title.rendered )
						),
						{
							type: 'snackbar',
							id: 'edit-site-post-restored',
						}
					);
				} catch ( error ) {
					const errorMessage =
						error.message && error.code !== 'unknown_error'
							? error.message
							: __(
									'An error occurred while restoring the post.'
							  );

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
	callback( post ) {
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
			callback( post ) {
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
	callback( post ) {
		const href = addQueryArgs( 'revision.php', {
			revision: post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id,
		} );
		document.location.href = href;
	},
};
