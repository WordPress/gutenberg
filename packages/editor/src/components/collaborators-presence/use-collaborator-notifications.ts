import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
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
	/**
	 * Labels registered for the post type with `register_post_type()`, such
	 * as `item_published`. Undefined while the post type is still loading.
	 */
	postTypeLabels: Record< string, string > | undefined;
	/** WordPress post status at the time of save. */
	status: string;
	/** Post status before this save, when known. */
	previousStatus: string | undefined;
	/**
	 * Resolves the label registered with `register_post_status()` for the
	 * saved status. Only called when the message names the status.
	 */
	getStatusLabel: () => Promise< string | undefined >;
}

/**
 * Appends the collaborator's name to one of the post type's own save
 * notices, e.g. "Post published." becomes "Post published. By Alice."
 *
 * The post type label is a whole translated sentence rather than a noun
 * dropped into a verb phrase, so translators can inflect the verb for each
 * post type, as core's own save notice does.
 *
 * @param notice The post type's notice sentence, e.g. `labels.item_published`.
 * @param name   Display name of the collaborator who saved.
 */
function attributeNotice( notice: string, name: string ): string {
	return sprintf(
		/* translators: 1: the post type's save notice, e.g. "Post published." 2: collaborator display name. */
		__( '%1$s By %2$s.' ),
		notice,
		name
	);
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
 * @param args.postTypeLabels Labels registered for the post type, when loaded.
 * @param args.status         WordPress post status at the time of save.
 * @param args.previousStatus Post status before this save, when known.
 * @param args.getStatusLabel Resolves the registered label of the status.
 */
async function getPostUpdatedMessage( {
	name,
	postTypeLabels,
	status,
	previousStatus,
	getStatusLabel,
}: PostUpdatedMessageArgs ): Promise< string > {
	const wasPublished =
		!! previousStatus && PUBLISHED_STATUSES.includes( previousStatus );

	// Core registers a full sentence per post type for each of these
	// transitions, which the editor's own save notice uses too.
	let notice: string | undefined;

	if ( ! wasPublished && status === 'publish' ) {
		notice = postTypeLabels?.item_published;
	} else if ( ! wasPublished && status === 'future' ) {
		notice = postTypeLabels?.item_scheduled;
	} else if ( ! wasPublished && status === 'private' ) {
		notice = postTypeLabels?.item_published_privately;
	} else if ( PUBLISHED_STATUSES.includes( status ) ) {
		notice = postTypeLabels?.item_updated;
	} else if ( wasPublished && DRAFT_STATUSES.includes( status ) ) {
		notice = postTypeLabels?.item_reverted_to_draft;
	}

	if ( notice ) {
		return attributeNotice( notice, name );
	}

	if ( DRAFT_STATUSES.includes( status ) && ! wasPublished ) {
		/* translators: %s: collaborator display name */
		return sprintf( __( 'Draft saved by %s.' ), name );
	}

	// Any other status change, such as to "pending" or to a status a plugin
	// registered, names the status the collaborator moved the post to, using
	// its registered label. A core transition lands here too when the post
	// type's labels have not loaded yet. A save that keeps the status is
	// reported as a plain save, and so is a status whose label cannot be
	// loaded.
	if ( status !== previousStatus && ! DRAFT_STATUSES.includes( status ) ) {
		const statusLabel = await getStatusLabel();

		if ( statusLabel ) {
			return sprintf(
				/* translators: 1: post status label, e.g. "Pending". 2: collaborator display name. */
				__( 'Status set to %1$s by %2$s.' ),
				statusLabel,
				name
			);
		}
	}

	/* translators: %s: collaborator display name */
	return sprintf( __( 'Saved by %s.' ), name );
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
		postTypeLabels,
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
			// Notification preferences default to enabled when unset.
			const getNotificationPreference = ( name: string ) =>
				select( preferencesStore ).get( 'core', name ) ?? true;

			return {
				postStatus: getCurrentPostAttribute( 'status' ) as
					string | undefined,
				// The editor loads the post type with the post, so this is
				// already resolved. `getPostType()` with no slug resolves the
				// whole collection, so only ask when a post type is known.
				postTypeLabels: postType
					? select( coreStore ).getPostType( postType )?.labels
					: undefined,
				isCollaborationEnabled: isCollaborationEnabledForCurrentPost(),
				showJoinNotifications: getNotificationPreference(
					'showCollaborationJoinNotifications'
				),
				showLeaveNotifications: getNotificationPreference(
					'showCollaborationLeaveNotifications'
				),
				showPostSaveNotifications: getNotificationPreference(
					'showCollaborationPostSaveNotifications'
				),
			};
		},
		[ postType ]
	);

	const { createNotice } = useDispatch( noticesStore );
	const registry = useRegistry();

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
			async (
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

				// Registered statuses carry the label a site set with
				// `register_post_status()`. The status is only requested
				// when a message names it, so editor startup makes no extra
				// request, and the record is cached for later saves.
				const getStatusLabel = async () => {
					try {
						const record = await registry
							.resolveSelect( coreStore )
							.getEntityRecord< PostStatusObject >(
								'root',
								'status',
								effectiveStatus
							);
						return record?.name;
					} catch {
						return undefined;
					}
				};

				const message = await getPostUpdatedMessage( {
					name: getCollaboratorDisplayName( saver.collaboratorInfo ),
					postTypeLabels,
					status: effectiveStatus,
					previousStatus,
					getStatusLabel,
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
				postTypeLabels,
				registry,
				shouldShowPostSaveNotifications,
			]
		)
	);
}
