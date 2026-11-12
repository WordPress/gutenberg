import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { entityContainsSnapshot } = unlock( coreDataPrivateApis );

export type SnapshotStatus = 'pending' | 'present' | 'missing';

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
 * The decision settles at most once, and never changes after that:
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
 * IMPORTANT: Mount this hook only once the post is the edited one, so that
 * the collaboration check reads this post.
 *
 * @param props            Hook props.
 * @param props.postType   The post type.
 * @param props.postId     The post ID.
 * @param [props.snapshot] Base64-encoded snapshot to check.
 * @return The snapshot status.
 */
export default function useEntityContainsSnapshot( {
	postType,
	postId,
	snapshot,
}: {
	postType: string;
	postId: number | string;
	snapshot?: string;
} ): SnapshotStatus {
	const { syncStatus, isCollaborationEnabled } = useSelect(
		( select ) => {
			if ( ! snapshot ) {
				return { syncStatus: undefined, isCollaborationEnabled: false };
			}

			return {
				syncStatus: unlock(
					select( coreStore )
				).getEntitySyncConnectionStatus( 'postType', postType, postId )
					?.status,
				isCollaborationEnabled: unlock(
					select( editorStore )
				).isCollaborationEnabledForCurrentPost(),
			};
		},
		[ postType, postId, snapshot ]
	);

	// Only a snapshot of a collaborative post can be confirmed by the shared
	// document, so only then is it worth waiting for a sync.
	const [ canWait ] = useState( isCollaborationEnabled );
	const [ hasWaitExpired, setHasWaitExpired ] = useState( false );
	const [ settledStatus, setSettledStatus ] =
		useState< SnapshotStatus >( 'pending' );

	useEffect( () => {
		if ( ! canWait ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setHasWaitExpired( true ),
			SNAPSHOT_STATUS_SYNC_WAIT_MS
		);
		return () => clearTimeout( timeoutId );
	}, [ canWait ] );

	if ( 'pending' !== settledStatus ) {
		return settledStatus;
	}

	let status: SnapshotStatus = 'pending';
	if ( ! canWait ) {
		status = 'missing';
	} else if (
		entityContainsSnapshot( 'postType', postType, postId, snapshot )
	) {
		status = 'present';
	} else if (
		// Collaboration was disabled after mount (e.g. incompatible meta
		// boxes were detected), the connection failed, or the document took
		// too long to confirm the snapshot.
		! isCollaborationEnabled ||
		'disconnected' === syncStatus ||
		hasWaitExpired
	) {
		status = 'missing';
	}

	if ( 'pending' !== status ) {
		setSettledStatus( status );
	}

	return status;
}
