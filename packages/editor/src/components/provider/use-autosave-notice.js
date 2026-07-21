/**
 * WordPress dependencies
 */
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { getEntityAutosavedAt } = unlock( coreDataPrivateApis );

/**
 * How long the deferred autosave notice waits for the author's autosave
 * marker to arrive from the sync backend before failing open and showing
 * the notice. Sync providers report 'connected' at different points relative
 * to the initial document sync, so a missing marker is not treated as
 * definitive until this wait expires.
 */
const AUTOSAVE_NOTICE_SYNC_WAIT_MS = 3000;

/**
 * Creates the warning notice about a more recent autosave.
 *
 * @param {Object}   props                      Function props.
 * @param {Object}   props.autosave             The `autosave` editor setting.
 * @param {Function} props.createWarningNotice  Action that creates the notice.
 * @param {Object}   props.registry             The data registry.
 * @param {Function} props.setCurrentRevisionId Action that opens a revision.
 */
function showAutosaveExistsNotice( {
	autosave,
	createWarningNotice,
	registry,
	setCurrentRevisionId,
} ) {
	// The only place core exposes the autosave ID is the edit
	// link, always `revision.php?revision=<autosave ID>`.
	const autosaveId = Number( getQueryArg( autosave.editLink, 'revision' ) );
	createWarningNotice(
		__(
			'There is an autosave of this post that is more recent than the version below.'
		),
		{
			id: 'autosave-exists',
			actions: [
				{
					label: __( 'View the autosave' ),
					...( autosaveId
						? {
								onClick: () => {
									// `disableVisualRevisions` is only set
									// after mount, so read it at click time.
									const { disableVisualRevisions } = registry
										.select( editorStore )
										.getEditorSettings();
									if ( disableVisualRevisions ) {
										window.location.href =
											autosave.editLink;
										return;
									}
									setCurrentRevisionId( autosaveId );
								},
						  }
						: { url: autosave.editLink } ),
				},
			],
		}
	);
}

/**
 * Shows the "more recent autosave" notice when applicable.
 *
 * Outside real-time collaboration, the notice is created immediately on
 * mount whenever the server flagged an autosave (`settings.autosave`).
 *
 * Under real-time collaboration, the autosave content is usually already
 * part of the shared document, making the notice redundant. The decision is
 * deferred and made at most once. The notice is suppressed as soon as the
 * author's autosave marker in the CRDT document confirms that the autosave
 * content is part of the shared document; the marker is the only positive
 * signal, so the decision holds for any sync provider regardless of what its
 * connection status implies about the initial document sync. Without that
 * signal, the notice is shown (fail open) once sync fails, collaboration is
 * disabled, or the wait expires, because the autosave may then be the only
 * copy of the content.
 *
 * IMPORTANT: Call this hook after the mount effect that dispatches
 * `setupEditor`, so that the collaboration check can read the current post.
 *
 * @param {Object}  props          Hook props.
 * @param {Object}  props.post     The post object.
 * @param {boolean} props.recovery Whether the editor is in recovery mode.
 * @param {Object}  props.settings The editor settings.
 */
export default function useAutosaveNotice( { post, recovery, settings } ) {
	const registry = useRegistry();
	const { createWarningNotice } = useDispatch( noticesStore );
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	// Whether the notice decision is pending a signal from the shared
	// document. Only set for collaborative posts.
	const isAutosaveNoticeDeferredRef = useRef( false );

	// Whether the deferred notice has waited long enough for the autosave
	// marker to arrive from the sync backend.
	const [ hasAutosaveNoticeWaitExpired, setHasAutosaveNoticeWaitExpired ] =
		useState( false );

	// Selected values used to re-run the deferred decision effect below.
	// The effect reads fresh store values when it runs.
	const { autosaveSyncStatus, isCollaborationEnabledForPost } = useSelect(
		( select ) => {
			if ( ! settings.autosave?.authorId ) {
				return {
					autosaveSyncStatus: undefined,
					isCollaborationEnabledForPost: false,
				};
			}

			return {
				autosaveSyncStatus: unlock(
					select( coreStore )
				).getEntitySyncConnectionStatus(
					'postType',
					post.type,
					post.id
				)?.status,
				isCollaborationEnabledForPost: unlock(
					select( editorStore )
				).isCollaborationEnabledForCurrentPost(),
			};
		},
		[ post.type, post.id, settings.autosave?.authorId ]
	);

	useLayoutEffect( () => {
		// Assume the notice is not needed in the case of an error recovery.
		if ( recovery || ! settings.autosave ) {
			return;
		}

		const canDeferAutosaveNotice =
			settings.autosave.authorId &&
			settings.autosave.modified &&
			unlock(
				registry.select( editorStore )
			).isCollaborationEnabledForCurrentPost();

		// Outside real-time collaboration, keep the original behavior and
		// create the notice immediately.
		if ( ! canDeferAutosaveNotice ) {
			showAutosaveExistsNotice( {
				autosave: settings.autosave,
				createWarningNotice,
				registry,
				setCurrentRevisionId,
			} );
			return;
		}

		// Defer the decision until the shared document confirms the
		// autosave, sync fails, or the wait expires (see the effects below).
		isAutosaveNoticeDeferredRef.current = true;

		// The notice decision is initiated once, on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Backstop timer for the deferred autosave notice decision below.
	useEffect( () => {
		if ( ! isAutosaveNoticeDeferredRef.current ) {
			return;
		}

		const timeoutId = setTimeout( () => {
			setHasAutosaveNoticeWaitExpired( true );
		}, AUTOSAVE_NOTICE_SYNC_WAIT_MS );

		return () => clearTimeout( timeoutId );
		// The wait starts once, on mount, alongside the deferral above.
	}, [] );

	// Deferred autosave notice decision for collaborative posts. See the
	// hook docblock for the full decision rules.
	useEffect( () => {
		if ( ! isAutosaveNoticeDeferredRef.current ) {
			return;
		}

		const autosavedAt = getEntityAutosavedAt(
			'postType',
			post.type,
			post.id,
			settings.autosave.authorId
		);
		const isAutosaveInSharedDocument =
			!! autosavedAt && autosavedAt >= settings.autosave.modified;

		const isCollaborationEnabled = unlock(
			registry.select( editorStore )
		).isCollaborationEnabledForCurrentPost();
		const syncStatus = unlock(
			registry.select( coreStore )
		).getEntitySyncConnectionStatus(
			'postType',
			post.type,
			post.id
		)?.status;

		let shouldShowNotice;

		if ( isAutosaveInSharedDocument ) {
			shouldShowNotice = false;
		} else if ( ! isCollaborationEnabled ) {
			// Collaboration was disabled after mount (e.g. incompatible
			// metaboxes were detected). Sync will never connect.
			shouldShowNotice = true;
		} else if ( 'disconnected' === syncStatus ) {
			// The connection failed before it was established, so the
			// shared document may be missing the autosaved content.
			shouldShowNotice = true;
		} else if ( hasAutosaveNoticeWaitExpired ) {
			// The marker did not arrive in time. Treat the autosave as
			// missing from the shared document.
			shouldShowNotice = true;
		} else {
			// Keep waiting for a definitive signal.
			return;
		}

		isAutosaveNoticeDeferredRef.current = false;

		if ( shouldShowNotice ) {
			showAutosaveExistsNotice( {
				autosave: settings.autosave,
				createWarningNotice,
				registry,
				setCurrentRevisionId,
			} );
		}
		// The decision must run at most once. `settings.autosave` and the
		// notice actions are stable for the lifetime of the provider; the
		// selected values only trigger re-evaluation.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		autosaveSyncStatus,
		hasAutosaveNoticeWaitExpired,
		isCollaborationEnabledForPost,
		post.type,
		post.id,
	] );
}
