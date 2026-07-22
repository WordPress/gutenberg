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

const { getEntityAutosavedAt, subscribeHasInitialSync } =
	unlock( coreDataPrivateApis );

/**
 * Backstop for the deferred autosave notice: how long to wait for the
 * shared document to sync before failing open and showing the notice. The
 * decision normally resolves as soon as the document syncs (see
 * `subscribeHasInitialSync`); this wait only applies when that state never
 * arrives, e.g. a provider that connects but whose initial sync stalls.
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
 * deferred and made at most once. It is resolved when the shared document
 * syncs (via `subscribeHasInitialSync`). The author's autosave marker is read
 * from the CRDT document, and because the initial sync is applied atomically,
 * a missing marker at that point is definitive. The notice is suppressed when
 * the marker confirms the autosave content is part of the shared document,
 * and shown (fail open) when the marker is absent after sync, collaboration is
 * disabled, the connection fails, or a backstop wait expires, because the
 * autosave may then be the only copy of the content.
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

	// Whether the deferred notice has waited long enough for the shared
	// document to sync.
	const [ hasAutosaveNoticeWaitExpired, setHasAutosaveNoticeWaitExpired ] =
		useState( false );

	// Whether the shared document has received its initial sync state. Set
	// once, via a single subscription, so the deferred decision effect below
	// can early-evaluate without polling individual remote updates.
	const [ isDocumentSynced, setIsDocumentSynced ] = useState( false );

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

			const connectionStatus = unlock(
				select( coreStore )
			).getEntitySyncConnectionStatus( 'postType', post.type, post.id );

			return {
				autosaveSyncStatus: connectionStatus?.status,
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
		// autosave, sync fails, or the backstop timer below expires (see
		// the decision effect below).
		isAutosaveNoticeDeferredRef.current = true;

		const timeoutId = setTimeout( () => {
			setHasAutosaveNoticeWaitExpired( true );
		}, AUTOSAVE_NOTICE_SYNC_WAIT_MS );

		return () => clearTimeout( timeoutId );

		// The notice decision is initiated once, on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Resolve the deferred decision as soon as the shared document syncs, so
	// the marker resolves the notice without waiting for the backstop timer.
	// The subscription fires once (immediately if the document already synced)
	// and may be attached before the entity is loaded, so a single subscription
	// keyed on the post is enough. No re-subscription or per-update polling is
	// needed.
	useEffect( () => {
		if ( ! isAutosaveNoticeDeferredRef.current ) {
			return;
		}

		return subscribeHasInitialSync( 'postType', post.type, post.id, () =>
			setIsDocumentSynced( true )
		);
	}, [ post.type, post.id ] );

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
		const connectionStatus = unlock(
			registry.select( coreStore )
		).getEntitySyncConnectionStatus( 'postType', post.type, post.id );

		let shouldShowNotice;

		if ( isAutosaveInSharedDocument ) {
			shouldShowNotice = false;
		} else if ( ! isCollaborationEnabled ) {
			// Collaboration was disabled after mount (e.g. incompatible
			// metaboxes were detected). Sync will never connect.
			shouldShowNotice = true;
		} else if ( 'disconnected' === connectionStatus?.status ) {
			// The connection failed before it was established, so the
			// shared document may be missing the autosaved content.
			shouldShowNotice = true;
		} else if ( isDocumentSynced ) {
			// The shared document received the server state (the initial
			// sync is applied atomically), yet contains no marker: the
			// autosave content is definitively not part of the document.
			shouldShowNotice = true;
		} else if ( hasAutosaveNoticeWaitExpired ) {
			// The document did not sync in time. Treat the autosave as
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
		// values below only trigger re-evaluation.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		autosaveSyncStatus,
		hasAutosaveNoticeWaitExpired,
		isCollaborationEnabledForPost,
		isDocumentSynced,
		post.type,
		post.id,
	] );
}
