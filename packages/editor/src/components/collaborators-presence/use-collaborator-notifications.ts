import { useEffect } from '@wordpress/element';
const { useActiveCollaborators, useLastPostSave } = unlock( privateApis );
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
	// Pass null when collaboration is disabled to prevent the hooks
	// from subscribing to awareness state.
	const effectivePostId = isCollaborationEnabled ? postId : null;
	const effectivePostType = isCollaborationEnabled ? postType : null;
	/*
	 * Detect collaborator joins and leaves.
	 */
	useEffect( () => {
		if ( ! isCollaborationEnabled ) {
			return;
		}

					continue;
				notify(
					`${ NOTIFICATION_TYPE.COLLAB_USER_ENTERED }-${ collaborator.collaboratorInfo.id }`,
					)
			}
		}
		/*
		 * Detect leaves by iterating the previous collaborator list. A leave
		 * notification fires when a previously-connected collaborator either:
		 *   - transitions to isConnected=false (greyed-out in the UI), or
		 *   - disappears from the list entirely while still connected.
				const newCollab = newMap.get( clientId );
				if ( newCollab?.isConnected ) {
						prevCollab.collaboratorInfo.name
					)
			}
		}
	}, [
		activeCollaborators,
	/*
	 * Detect remote save events via the CRDT state map. The savedByClientId
	 * is a Y.Doc client ID which maps to a collaborator via clientId.
	 */
	useEffect( () => {
		if (
			! isCollaborationEnabled ||
			! NOTIFICATIONS_CONFIG.postUpdated ||
			! lastPostSave ||
				if ( ! NOTIFICATIONS_CONFIG.postUpdated || ! postStatus ) {
		) {
			return;
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
