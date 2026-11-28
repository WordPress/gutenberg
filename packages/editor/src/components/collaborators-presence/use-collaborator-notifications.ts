import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
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
import { STATUS_OPTIONS } from '../post-status/constants';
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

	// A draft saved as a draft is the everyday case and needs no status.
	const stayedDraft =
		DRAFT_STATUSES.includes( status ) &&
		( ! previousStatus || DRAFT_STATUSES.includes( previousStatus ) );
	if ( stayedDraft ) {
		/* translators: %s: collaborator display name */
		return sprintf( __( 'Draft saved by %s.' ), name );
	}

	// Any other status change names the status the collaborator moved the
	// post to, using its registered label: into "pending" or a status a
	// plugin registered, and also out of such a status back to draft, so
	// leaving a status like "Embargoed" is visible. A core transition lands
	// here too when the post type's labels have not loaded yet. A save that
	// keeps the status is reported as a plain save, and so is a status whose
	// label cannot be loaded.
	if ( status !== previousStatus ) {
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

	// The save callback waits for a status lookup before it posts its notice,
	// and every notice from the same saver shares an ID. These refs let the
	// callback drop a notice that is stale by the time the lookup finishes:
	// a newer save has started, the preference was turned off, or the
	// component unmounted.
	const latestSaveRef = useRef( 0 );
	const canNotifyOnSaveRef = useRef( false );

	// Pass null when collaboration is disabled or a notification type is
	// turned off to prevent the hooks from subscribing to awareness state.
	const shouldShowJoinNotifications =
		isCollaborationEnabled && showJoinNotifications;
	const shouldShowLeaveNotifications =
		isCollaborationEnabled && showLeaveNotifications;
	const shouldShowPostSaveNotifications =
		isCollaborationEnabled && showPostSaveNotifications;
	useEffect( () => {
		canNotifyOnSaveRef.current = shouldShowPostSaveNotifications;
		return () => {
			canNotifyOnSaveRef.current = false;
		};
	}, [ shouldShowPostSaveNotifications ] );
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

				const saveNumber = ++latestSaveRef.current;

				// Prefer the remote status from Y.Doc (accurate at save time)
				// over the local Redux value, which may not have synced yet.
				const effectiveStatus =
					saveEvent.postStatus ?? postStatus ?? 'draft';

				// Use the previous save event's status when available for
				// accurate status change detection across rapid saves.
				const previousStatus = prevEvent?.postStatus ?? postStatus;

				// Core statuses use the same labels as the editor's status
				// control, with no request. Any other status is requested
				// only when a message names it, so editor startup makes no
				// extra request, and the record is cached for later saves.
				// Its label is the one a site set with `register_post_status()`.
				const getStatusLabel = async () => {
					const coreStatusLabel = STATUS_OPTIONS.find(
						( option ) => option.value === effectiveStatus
					)?.label;
					if ( coreStatusLabel ) {
						return coreStatusLabel;
					}

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

				// The lookup may have taken a while. Only the newest save gets
				// to post, and only while notifications are still wanted.
				if (
					saveNumber !== latestSaveRef.current ||
					! canNotifyOnSaveRef.current
				) {
					return;
				}

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
