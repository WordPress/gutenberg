/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	check,
	cancelCircleFilled,
	trash,
	backup,
	bug,
} from '@wordpress/icons';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { CommentWithPermissions } from './types';
import { COMMENT_STATUSES } from './types';

/**
 * Approve a pending comment.
 */
export const approveComment: Action< CommentWithPermissions > = {
	id: 'approve-comment',
	label: __( 'Approve' ),
	icon: check,
	isPrimary: true,
	supportsBulk: true,
	isEligible( item ) {
		return item.status === COMMENT_STATUSES.HOLD;
	},
	async callback( items, { registry } ) {
		const { editEntityRecord, saveEditedEntityRecord } =
			registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		try {
			await Promise.all(
				items.map( async ( item ) => {
					await editEntityRecord( 'root', 'comment', item.id, {
						status: 'approve',
					} );
					await saveEditedEntityRecord( 'root', 'comment', item.id, {
						throwOnError: true,
					} );
				} )
			);
			let successMessage;
			if ( items.length === 1 ) {
				successMessage = __( 'Comment approved.' );
			} else {
				successMessage = sprintf(
					/* translators: %d: The number of comments. */
					__( '%d comments approved.' ),
					items.length
				);
			}
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'approve-comment-action',
			} );
		} catch {
			createErrorNotice( __( 'An error occurred while approving.' ), {
				type: 'snackbar',
			} );
		}
	},
};

/**
 * Unapprove (hold) an approved comment.
 */
export const unapproveComment: Action< CommentWithPermissions > = {
	id: 'unapprove-comment',
	label: __( 'Unapprove' ),
	icon: cancelCircleFilled,
	isPrimary: true,
	supportsBulk: true,
	isEligible( item ) {
		return item.status === COMMENT_STATUSES.APPROVE;
	},
	async callback( items, { registry } ) {
		const { editEntityRecord, saveEditedEntityRecord } =
			registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		try {
			await Promise.all(
				items.map( async ( item ) => {
					await editEntityRecord( 'root', 'comment', item.id, {
						status: 'hold',
					} );
					await saveEditedEntityRecord( 'root', 'comment', item.id, {
						throwOnError: true,
					} );
				} )
			);
			let successMessage;
			if ( items.length === 1 ) {
				successMessage = __( 'Comment unapproved.' );
			} else {
				successMessage = sprintf(
					/* translators: %d: The number of comments. */
					__( '%d comments unapproved.' ),
					items.length
				);
			}
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'unapprove-comment-action',
			} );
		} catch {
			createErrorNotice( __( 'An error occurred while unapproving.' ), {
				type: 'snackbar',
			} );
		}
	},
};

/**
 * Mark comment as spam.
 */
export const spamComment: Action< CommentWithPermissions > = {
	id: 'spam-comment',
	label: __( 'Mark as Spam' ),
	icon: bug,
	supportsBulk: true,
	isEligible( item ) {
		return (
			item.status !== COMMENT_STATUSES.SPAM &&
			item.status !== COMMENT_STATUSES.TRASH
		);
	},
	async callback( items, { registry } ) {
		const { editEntityRecord, saveEditedEntityRecord } =
			registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		try {
			await Promise.all(
				items.map( async ( item ) => {
					await editEntityRecord( 'root', 'comment', item.id, {
						status: 'spam',
					} );
					await saveEditedEntityRecord( 'root', 'comment', item.id, {
						throwOnError: true,
					} );
				} )
			);
			let successMessage;
			if ( items.length === 1 ) {
				successMessage = __( 'Comment marked as spam.' );
			} else {
				successMessage = sprintf(
					/* translators: %d: The number of comments. */
					__( '%d comments marked as spam.' ),
					items.length
				);
			}
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'spam-comment-action',
			} );
		} catch {
			createErrorNotice(
				__( 'An error occurred while marking as spam.' ),
				{ type: 'snackbar' }
			);
		}
	},
};

/**
 * Restore comment from spam or trash back to its previous status (approved).
 */
export const restoreComment: Action< CommentWithPermissions > = {
	id: 'restore-comment',
	label: __( 'Restore' ),
	icon: backup,
	isPrimary: true,
	supportsBulk: true,
	isEligible( item ) {
		return (
			item.status === COMMENT_STATUSES.SPAM ||
			item.status === COMMENT_STATUSES.TRASH
		);
	},
	async callback( items, { registry } ) {
		const { editEntityRecord, saveEditedEntityRecord } =
			registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		try {
			await Promise.all(
				items.map( async ( item ) => {
					await editEntityRecord( 'root', 'comment', item.id, {
						status: 'approve',
					} );
					await saveEditedEntityRecord( 'root', 'comment', item.id, {
						throwOnError: true,
					} );
				} )
			);
			let successMessage;
			if ( items.length === 1 ) {
				successMessage = __( 'Comment restored.' );
			} else {
				successMessage = sprintf(
					/* translators: %d: The number of comments. */
					__( '%d comments restored.' ),
					items.length
				);
			}
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'restore-comment-action',
			} );
		} catch {
			createErrorNotice( __( 'An error occurred while restoring.' ), {
				type: 'snackbar',
			} );
		}
	},
};

/**
 * Move comment to trash (soft delete).
 */
export const trashComment: Action< CommentWithPermissions > = {
	id: 'trash-comment',
	label: __( 'Move to Trash' ),
	icon: trash,
	supportsBulk: true,
	isEligible( item ) {
		return item.status !== COMMENT_STATUSES.TRASH;
	},
	async callback( items, { registry } ) {
		const { deleteEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		try {
			await Promise.all(
				items.map( ( item ) =>
					deleteEntityRecord(
						'root',
						'comment',
						item.id,
						{},
						{
							throwOnError: true,
						}
					)
				)
			);
			let successMessage;
			if ( items.length === 1 ) {
				successMessage = __( 'Comment moved to trash.' );
			} else {
				successMessage = sprintf(
					/* translators: %d: The number of comments. */
					__( '%d comments moved to trash.' ),
					items.length
				);
			}
			createSuccessNotice( successMessage, {
				type: 'snackbar',
				id: 'trash-comment-action',
			} );
		} catch {
			createErrorNotice(
				__( 'An error occurred while moving to trash.' ),
				{ type: 'snackbar' }
			);
		}
	},
};

/**
 * Permanently delete a comment (only available in Trash view).
 */
export const deleteComment: Action< CommentWithPermissions > = {
	id: 'delete-comment',
	label: __( 'Delete Permanently' ),
	icon: trash,
	isDestructive: true,
	supportsBulk: true,
	hideModalHeader: true,
	isEligible( item ) {
		return item.status === COMMENT_STATUSES.TRASH;
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { deleteEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		let confirmMessage;
		if ( items.length === 1 ) {
			confirmMessage = __(
				'Are you sure you want to permanently delete this comment?'
			);
		} else {
			confirmMessage = sprintf(
				/* translators: %d: The number of comments. */
				__(
					'Are you sure you want to permanently delete %d comments?'
				),
				items.length
			);
		}

		return (
			<VStack spacing="5">
				<Text>{ confirmMessage }</Text>
				<HStack justify="right">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						isDestructive
						onClick={ async () => {
							setIsBusy( true );
							try {
								await Promise.all(
									items.map( ( item ) =>
										deleteEntityRecord(
											'root',
											'comment',
											item.id,
											{ force: true },
											{ throwOnError: true }
										)
									)
								);
								let successMessage;
								if ( items.length === 1 ) {
									successMessage = __(
										'Comment permanently deleted.'
									);
								} else {
									successMessage = sprintf(
										/* translators: %d: The number of comments. */
										__(
											'%d comments permanently deleted.'
										),
										items.length
									);
								}
								createSuccessNotice( successMessage, {
									type: 'snackbar',
									id: 'delete-comment-action',
								} );
								onActionPerformed?.( items );
							} catch {
								createErrorNotice(
									__( 'An error occurred while deleting.' ),
									{ type: 'snackbar' }
								);
							}
							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Delete Permanently' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};
