import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { entityContainsSnapshot } = unlock( coreDataPrivateApis );

/**
 * How long the snapshot status decision waits for the shared document to
 * sync before failing open and resolving to 'missing'. The decision can
 * resolve earlier when the document proves it contains the snapshot or the
 * connection fails.
 */
export const SNAPSHOT_STATUS_SYNC_WAIT_MS = 3000;

/**
 * Decides whether the shared (CRDT) document for a post contains everything
 * a previously captured snapshot describes.
 *
 * The decision is made at most once, shortly after mount:
 *
 * - 'present' when the shared document proves it holds everything the
 *   snapshot captured. The changes the snapshot describes are either part of
 *   the document or were deliberately superseded by later changes, so any
 *   artifact recorded alongside the snapshot (an autosave, a browser backup)
 *   is redundant.
 * - 'missing' when the snapshot cannot be confirmed: no snapshot was given,
 *   collaboration is not (or no longer) enabled for the post, the sync
 *   connection failed, or the document did not confirm the snapshot within
 *   `SNAPSHOT_STATUS_SYNC_WAIT_MS`. Callers should fail open and treat the
 *   snapshotted artifact as meaningful.
 * - 'pending' while the decision is still waiting for one of those signals.
 *
 * IMPORTANT: Call this hook after the mount effect that dispatches
 * `setupEditor`, so that the collaboration check can read the current post.
 *
 * @param {Object}        props            Hook props.
 * @param {string}        props.postType   The post type.
 * @param {number|string} props.postId     The post ID.
 * @param {string}        [props.snapshot] Base64-encoded snapshot to check.
 *
 * @return {'pending'|'present'|'missing'} The snapshot status.
 */
export default function useEntityContainsSnapshot( {
	postType,
	postId,
	snapshot,
} ) {
	const registry = useRegistry();

	const [ snapshotStatus, setSnapshotStatus ] = useState( 'pending' );

	// Whether the decision is still waiting for a signal from the shared
	// document. Only set for collaborative posts.
	const isPendingRef = useRef( false );

	// Whether the decision has waited long enough for the shared document
	// to sync.
	const [ hasWaitExpired, setHasWaitExpired ] = useState( false );

	// Selected values used to re-run the decision effect below. The effect
	// reads fresh store values when it runs.
	const { syncStatus, isCollaborationEnabledForPost } = useSelect(
		( select ) => {
			if ( ! snapshot ) {
				return {
					syncStatus: undefined,
					isCollaborationEnabledForPost: false,
				};
			}

			const connectionStatus = unlock(
				select( coreStore )
			).getEntitySyncConnectionStatus( 'postType', postType, postId );

			return {
				syncStatus: connectionStatus?.status,
				isCollaborationEnabledForPost: unlock(
					select( editorStore )
				).isCollaborationEnabledForCurrentPost(),
			};
		},
		[ postType, postId, snapshot ]
	);

	useLayoutEffect( () => {
		const canDefer =
			snapshot &&
			unlock(
				registry.select( editorStore )
			).isCollaborationEnabledForCurrentPost();

		// Without a snapshot to check, or outside real-time collaboration,
		// the shared document can never confirm the snapshot. Fail open
		// right away.
		if ( ! canDefer ) {
			setSnapshotStatus( 'missing' );
			return;
		}

		// Defer the decision until the shared document confirms the snapshot,
		// sync fails, or the wait deadline below expires (see the decision
		// effect below).
		isPendingRef.current = true;

		const timeoutId = setTimeout( () => {
			setHasWaitExpired( true );
		}, SNAPSHOT_STATUS_SYNC_WAIT_MS );

		return () => clearTimeout( timeoutId );

		// The decision is initiated once, on mount.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Deferred snapshot status decision for collaborative posts. See the
	// hook docblock for the full decision rules.
	useEffect( () => {
		if ( ! isPendingRef.current ) {
			return;
		}

		const containsSnapshot = entityContainsSnapshot(
			'postType',
			postType,
			postId,
			snapshot
		);

		const isCollaborationEnabled = unlock(
			registry.select( editorStore )
		).isCollaborationEnabledForCurrentPost();
		const connectionStatus = unlock(
			registry.select( coreStore )
		).getEntitySyncConnectionStatus( 'postType', postType, postId );

		let nextSnapshotStatus;

		if ( containsSnapshot ) {
			nextSnapshotStatus = 'present';
		} else if ( ! isCollaborationEnabled ) {
			// Collaboration was disabled after mount (e.g. incompatible
			// metaboxes were detected). Sync will never connect.
			nextSnapshotStatus = 'missing';
		} else if ( 'disconnected' === connectionStatus?.status ) {
			// The connection failed before it was established, so the
			// shared document may be missing the snapshotted content.
			nextSnapshotStatus = 'missing';
		} else if ( hasWaitExpired ) {
			// The document did not confirm the snapshot in time. Treat the
			// snapshotted content as missing from the shared document.
			nextSnapshotStatus = 'missing';
		} else {
			// Keep waiting for a definitive signal.
			return;
		}

		isPendingRef.current = false;
		setSnapshotStatus( nextSnapshotStatus );

		// The decision must run at most once. `snapshot` is stable for the
		// lifetime of the caller; the values below only trigger
		// re-evaluation.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		syncStatus,
		hasWaitExpired,
		isCollaborationEnabledForPost,
		postType,
		postId,
	] );

	return snapshotStatus;
}
