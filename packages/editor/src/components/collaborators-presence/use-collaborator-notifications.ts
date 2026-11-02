import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	privateApis,
	store as coreStore,
	type PostEditorAwarenessState,
	type PostSaveEvent,
	type PostStatusObject,
} from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import { getCollaboratorDisplayName } from '../../utils/get-collaborator-display-name';

const { useOnCollaboratorJoin, useOnCollaboratorLeave, useOnPostSave } =
	unlock( privateApis );

/**
 * Notice IDs for each notification type. Using stable IDs prevents duplicate
 * notices if the same event is processed more than once.
 */
const NOTIFICATION_TYPE = {
	COLLAB_POST_UPDATED: 'collab-post-updated',
	COLLAB_USER_ENTERED: 'collab-user-entered',
	COLLAB_USER_EXITED: 'collab-user-exited',
} as const;

/**
 * Statuses that count as "published" for the purpose of choosing a message.
 * Matches the list the editor's own save notice uses.
 */
const PUBLISHED_STATUSES = [ 'publish', 'private', 'future' ];

const DRAFT_STATUSES = [ 'draft', 'auto-draft' ];

interface PostUpdatedMessageArgs {
	/** Display name of the collaborator who saved. */
	name: string;
	/** Singular label of the post type, e.g. "Post" or "Story". */
	postTypeLabel: string;
	/** WordPress post status at the time of save. */
	status: string;
	/** Status label registered with `register_post_status()`, when known. */
	statusLabel: string | undefined;
	/** Post status before this save, when known. */
	previousStatus: string | undefined;
}

/**
 * Returns the snackbar message for a post updated notification.
 *
 * The message is built from the labels a site registers with
 * `register_post_type()` and `register_post_status()`, so a site that calls
 * posts "stories" or adds an "Embargo" status sees its own words instead of
 * "post" and "published".
 *
 * @param args                Message inputs.
 * @param args.name           Display name of the collaborator who saved.
 * @param args.postTypeLabel  Singular label of the post type, e.g. "Post".
 * @param args.status         WordPress post status at the time of save.
 * @param args.statusLabel    Registered label of that status, when known.
 * @param args.previousStatus Post status before this save, when known.
 */
function getPostUpdatedMessage( {
	name,
	postTypeLabel,
	status,
	statusLabel,
	previousStatus,
}: PostUpdatedMessageArgs ): string {
	const wasPublished =
		!! previousStatus && PUBLISHED_STATUSES.includes( previousStatus );

	if ( ! wasPublished && status === 'publish' ) {
		return sprintf(
			/* translators: 1: post type singular label, e.g. "Post". 2: collaborator display name. */
			__( '%1$s published by %2$s.' ),
			postTypeLabel,
			name
		);
	}

	if ( ! wasPublished && status === 'future' ) {
		return sprintf(
			/* translators: 1: post type singular label, e.g. "Post". 2: collaborator display name. */
			__( '%1$s scheduled by %2$s.' ),
			postTypeLabel,
			name
		);
	}

	if ( ! wasPublished && status === 'private' ) {
		return sprintf(
			/* translators: 1: post type singular label, e.g. "Post". 2: collaborator display name. */
			__( '%1$s published privately by %2$s.' ),
			postTypeLabel,
			name
		);
	}

	if ( PUBLISHED_STATUSES.includes( status ) ) {
		return sprintf(
			/* translators: 1: post type singular label, e.g. "Post". 2: collaborator display name. */
			__( '%1$s updated by %2$s.' ),
			postTypeLabel,
			name
		);
	}

	if ( DRAFT_STATUSES.includes( status ) ) {
		if ( wasPublished ) {
			return sprintf(
				/* translators: 1: post type singular label, e.g. "Post". 2: collaborator display name. */
				__( '%1$s reverted to draft by %2$s.' ),
				postTypeLabel,
				name
			);
		}

		/* translators: %s: collaborator display name */
		return sprintf( __( 'Draft saved by %s.' ), name );
	}

	// Any other status, such as "pending" or one a plugin registered: name
	// the status the collaborator moved the post to, using its registered
	// label. A save that keeps the status is reported as a plain save.
	if ( status !== previousStatus && statusLabel ) {
		return sprintf(
			/* translators: 1: post type singular label, e.g. "Post". 2: post status label, e.g. "Pending". 3: collaborator display name. */
			__( '%1$s status set to %2$s by %3$s.' ),
			postTypeLabel,
			statusLabel,
			name
		);
	}

	return sprintf(
		/* translators: 1: post type singular label, e.g. "Post". 2: collaborator display name. */
		__( '%1$s saved by %2$s.' ),
		postTypeLabel,
		name
	);
}

/**
 * Hook that watches for collaborator join/leave events and remote save events,
 * dispatching snackbar notices accordingly.
 *
 * @param postId   The ID of the post being edited.
 * @param postType The post type of the post being edited.
 */
export function useCollaboratorNotifications(
	postId: number | null,
	postType: string | null
): void {
	const {
		postStatus,
		postTypeLabel,
		postStatuses,
		isCollaborationEnabled,
		showJoinNotifications,
		showLeaveNotifications,
		showPostSaveNotifications,
	} = useSelect(
		( select ) => {
			const {
				getCurrentPostAttribute,
				isCollaborationEnabledForCurrentPost,
			} = unlock( select( editorStore ) );
			const { getEntityRecords, getPostType } = select( coreStore );
			// Notification preferences default to enabled when unset.
			const getNotificationPreference = ( name: string ) =>
				select( preferencesStore ).get( 'core', name ) ?? true;
			const _isCollaborationEnabled =
				isCollaborationEnabledForCurrentPost();
			const _showPostSaveNotifications = getNotificationPreference(
				'showCollaborationPostSaveNotifications'
			);
			const needsSaveLabels =
				_isCollaborationEnabled && _showPostSaveNotifications;

			return {
				postStatus: getCurrentPostAttribute( 'status' ) as
					string | undefined,
				// `getPostType()` with no slug resolves the whole collection,
				// so only ask for it when a post type is known.
				postTypeLabel:
					needsSaveLabels && postType
						? getPostType( postType )?.labels?.singular_name
						: undefined,
				// Registered post statuses carry the labels a site set with
				// `register_post_status()`, including custom statuses.
				postStatuses: needsSaveLabels
					? getEntityRecords< PostStatusObject >( 'root', 'status' )
					: undefined,
				isCollaborationEnabled: _isCollaborationEnabled,
				showJoinNotifications: getNotificationPreference(
					'showCollaborationJoinNotifications'
				),
				showLeaveNotifications: getNotificationPreference(
					'showCollaborationLeaveNotifications'
				),
				showPostSaveNotifications: _showPostSaveNotifications,
			};
		},
		[ postType ]
	);

	const { createNotice } = useDispatch( noticesStore );

	// Pass null when collaboration is disabled or a notification type is
	// turned off to prevent the hooks from subscribing to awareness state.
	const shouldShowJoinNotifications =
		isCollaborationEnabled && showJoinNotifications;
	const shouldShowLeaveNotifications =
		isCollaborationEnabled && showLeaveNotifications;
	const shouldShowPostSaveNotifications =
		isCollaborationEnabled && showPostSaveNotifications;
	// A disabled notification type passes null, which unsubscribes its hook;
	// callback guards handle any events already queued before then.
	const effectiveTarget = (
		shouldShow: boolean
	): [ number | null, string | null ] =>
		shouldShow ? [ postId, postType ] : [ null, null ];
	const [ joinPostId, joinPostType ] = effectiveTarget(
		shouldShowJoinNotifications
	);
	const [ leavePostId, leavePostType ] = effectiveTarget(
		shouldShowLeaveNotifications
	);
	const [ postSavePostId, postSavePostType ] = effectiveTarget(
		shouldShowPostSaveNotifications
	);

	useOnCollaboratorJoin(
		joinPostId,
		joinPostType,
		useCallback(
			(
				collaborator: PostEditorAwarenessState,
				me?: PostEditorAwarenessState
			) => {
				if ( ! shouldShowJoinNotifications ) {
					return;
				}

				/*
				 * Skip collaborators who were present before the current user
				 * joined. Their enteredAt is earlier than ours, meaning we're
				 * the newcomer.
				 */
				if (
					me &&
					collaborator.collaboratorInfo.enteredAt <
						me.collaboratorInfo.enteredAt
				) {
					return;
				}

				void createNotice(
					'info',
					sprintf(
						/* translators: %s: collaborator display name */
						__( '%s has joined the post.' ),
						getCollaboratorDisplayName(
							collaborator.collaboratorInfo
						)
					),
					{
						id: `${ NOTIFICATION_TYPE.COLLAB_USER_ENTERED }-${
							collaborator.collaboratorInfo.id ??
							collaborator.clientId
						}`,
						type: 'snackbar',
						isDismissible: false,
					}
				);
			},
			[ createNotice, shouldShowJoinNotifications ]
		)
	);

	useOnCollaboratorLeave(
		leavePostId,
		leavePostType,
		useCallback(
			( collaborator: PostEditorAwarenessState ) => {
				if ( ! shouldShowLeaveNotifications ) {
					return;
				}

				void createNotice(
					'info',
					sprintf(
						/* translators: %s: collaborator display name */
						__( '%s has left the post.' ),
						getCollaboratorDisplayName(
							collaborator.collaboratorInfo
						)
					),
					{
						id: `${ NOTIFICATION_TYPE.COLLAB_USER_EXITED }-${
							collaborator.collaboratorInfo.id ??
							collaborator.clientId
						}`,
						type: 'snackbar',
						isDismissible: false,
					}
				);
			},
			[ createNotice, shouldShowLeaveNotifications ]
		)
	);

	useOnPostSave(
		postSavePostId,
		postSavePostType,
		useCallback(
			(
				saveEvent: PostSaveEvent,
				saver: PostEditorAwarenessState,
				prevEvent: PostSaveEvent | null
			) => {
				if ( ! shouldShowPostSaveNotifications || ! postStatus ) {
					return;
				}

				// Prefer the remote status from Y.Doc (accurate at save time)
				// over the local Redux value, which may not have synced yet.
				const effectiveStatus =
					saveEvent.postStatus ?? postStatus ?? 'draft';

				// Use the previous save event's status when available for
				// accurate status change detection across rapid saves.
				const previousStatus = prevEvent?.postStatus ?? postStatus;

				const message = getPostUpdatedMessage( {
					name: getCollaboratorDisplayName( saver.collaboratorInfo ),
					// The post type is loaded with the post, so the fallback
					// only covers a save that lands before it resolves.
					postTypeLabel: postTypeLabel ?? __( 'Post' ),
					status: effectiveStatus,
					statusLabel: postStatuses?.find(
						( postStatusRecord ) =>
							postStatusRecord.slug === effectiveStatus
					)?.name,
					previousStatus,
				} );

				void createNotice( 'info', message, {
					id: `${ NOTIFICATION_TYPE.COLLAB_POST_UPDATED }-${
						saver.collaboratorInfo.id ?? saver.clientId
					}`,
					type: 'snackbar',
					isDismissible: false,
				} );
			},
			[
				createNotice,
				postStatus,
				postStatuses,
				postTypeLabel,
				shouldShowPostSaveNotifications,
			]
		)
	);
}
