/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	privateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { useActiveCollaborators, useLastPostSave } = unlock( privateApis );

/**
 * Notice IDs for each notification type. Using stable IDs prevents duplicate
 * notices if the same event is processed more than once.
 */
const NOTIFICATION_TYPE = {
	COLLAB_POST_UPDATED: 'collab-post-updated',
	COLLAB_USER_ENTERED: 'collab-user-entered',
	COLLAB_USER_EXITED: 'collab-user-exited',
} as const;

const NOTIFICATIONS_CONFIG = {
	userEntered: true,
	userExited: true,
	postUpdated: true,
};

const PUBLISHED_STATUSES = [ 'publish', 'private', 'future' ];

/**
 * Returns the snackbar message for a post updated notification.
 *
 * @param name           Display name of the collaborator who saved.
 * @param status         WordPress post status at the time of save.
 * @param isFirstPublish Whether this save transitioned the post to published.
 */
function getPostUpdatedMessage(
	name: string,
	status: string,
	isFirstPublish: boolean
): string {
	if ( isFirstPublish ) {
		/* translators: %s: collaborator display name */
		return sprintf( __( 'Post published by %s.' ), name );
	}
	if ( PUBLISHED_STATUSES.includes( status ) ) {
		/* translators: %s: collaborator display name */
		return sprintf( __( 'Post updated by %s.' ), name );
	}
	/* translators: %s: collaborator display name */
	return sprintf( __( 'Draft saved by %s.' ), name );
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
	const activeCollaborators = useActiveCollaborators(
		postId,
		postType
	) as PostEditorAwarenessState[];

	const lastPostSave = useLastPostSave( postId, postType );

	const { postStatus, isCollaborationEnabled } = useSelect( ( select ) => {
		const editorSel = select( editorStore );
		return {
			postStatus: editorSel.getCurrentPostAttribute( 'status' ) as
				| string
				| undefined,
			isCollaborationEnabled:
				editorSel.isCollaborationEnabledForCurrentPost(),
		};
	}, [] );

	const { createNotice } = useDispatch( noticesStore );

	const prevCollaborators = usePrevious( activeCollaborators );
	const prevPostSave = usePrevious( lastPostSave );

	/*
	 * Detect collaborator joins and leaves.
	 */
	useEffect( () => {
		if ( ! isCollaborationEnabled ) {
			return;
		}

		/*
		 * On first render usePrevious returns undefined. On subsequent renders
		 * the list may still be empty while the store hydrates. In both cases,
		 * skip to avoid spurious "X joined" toasts for users already present.
		 */
		if ( ! prevCollaborators || prevCollaborators.length === 0 ) {
			return;
		}

		function notify( noticeId: string, message: string ) {
			void createNotice( 'info', message, {
				id: noticeId,
				type: 'snackbar',
				isDismissible: false,
			} );
		}

		const prevMap = new Map< number, PostEditorAwarenessState >(
			prevCollaborators.map( ( c ) => [ c.clientId, c ] )
		);
		const newMap = new Map< number, PostEditorAwarenessState >(
			activeCollaborators.map( ( c ) => [ c.clientId, c ] )
		);

		/*
		 * Detect joins: new clientIds that weren't in the previous state.
		 */
		if ( NOTIFICATIONS_CONFIG.userEntered ) {
			const me = activeCollaborators.find( ( c ) => c.isMe );

			for ( const [ clientId, collaborator ] of newMap ) {
				if ( prevMap.has( clientId ) || collaborator.isMe ) {
					continue;
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
					continue;
				}

				notify(
					`${ NOTIFICATION_TYPE.COLLAB_USER_ENTERED }-${ collaborator.collaboratorInfo.id }`,
					sprintf(
						/* translators: %s: collaborator display name */
						__( '%s has joined the post.' ),
						collaborator.collaboratorInfo.name
					)
				);
			}
		}

		/*
		 * Detect leaves by iterating the previous collaborator list. A leave
		 * notification fires when a previously-connected collaborator either:
		 *   - transitions to isConnected=false (greyed-out in the UI), or
		 *   - disappears from the list entirely while still connected.
		 * Already-disconnected collaborators that are later removed from the
		 * list (after the 5 s delay) are silently ignored.
		 */
		if ( NOTIFICATIONS_CONFIG.userExited ) {
			for ( const [ clientId, prevCollab ] of prevMap ) {
				if ( prevCollab.isMe || ! prevCollab.isConnected ) {
					continue;
				}

				const newCollab = newMap.get( clientId );
				if ( newCollab?.isConnected ) {
					continue;
				}

				notify(
					`${ NOTIFICATION_TYPE.COLLAB_USER_EXITED }-${ prevCollab.collaboratorInfo.id }`,
					sprintf(
						/* translators: %s: collaborator display name */
						__( '%s has left the post.' ),
						prevCollab.collaboratorInfo.name
					)
				);
			}
		}
	}, [
		activeCollaborators,
		prevCollaborators,
		isCollaborationEnabled,
		createNotice,
	] );

	/*
	 * Detect remote save events via the CRDT state map. The savedByClientId
	 * is a Y.Doc client ID which maps to a collaborator via clientId.
	 */
	useEffect( () => {
		if (
			! isCollaborationEnabled ||
			! NOTIFICATIONS_CONFIG.postUpdated ||
			! lastPostSave ||
			! postStatus
		) {
			return;
		}

		if ( prevPostSave && lastPostSave.savedAt === prevPostSave.savedAt ) {
			return;
		}

		const saver = activeCollaborators.find(
			( c ) => c.clientId === lastPostSave.savedByClientId && ! c.isMe
		);

		if ( ! saver ) {
			return;
		}

		// Prefer the remote status from Y.Doc (accurate at save time) over
		// the local Redux value, which may not have synced yet.
		const effectiveStatus =
			lastPostSave.postStatus ?? postStatus ?? 'draft';

		// prevPostSave is null on the first save this session, so fall back
		// to the Redux status (still pre-save when the notification fires).
		const prevStatus = prevPostSave?.postStatus ?? postStatus;
		const isFirstPublish =
			! ( prevStatus && PUBLISHED_STATUSES.includes( prevStatus ) ) &&
			PUBLISHED_STATUSES.includes( effectiveStatus );

		const message = getPostUpdatedMessage(
			saver.collaboratorInfo.name,
			effectiveStatus,
			isFirstPublish
		);

		void createNotice( 'info', message, {
			id: `${ NOTIFICATION_TYPE.COLLAB_POST_UPDATED }-${ saver.collaboratorInfo.id }`,
			type: 'snackbar',
			isDismissible: false,
		} );
	}, [
		lastPostSave,
		prevPostSave,
		activeCollaborators,
		isCollaborationEnabled,
		postStatus,
		createNotice,
	] );
}
