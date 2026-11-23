import { useSelect, useDispatch } from '@wordpress/data';
import {
	useEffect,
	useMemo,
	useState,
	useSyncExternalStore,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { store as uploadStore } from '@wordpress/upload-media';
import { store as noticesStore } from '@wordpress/notices';
import { Icon as WCIcon, Spinner as WCSpinner } from '@wordpress/components';
import { check } from '@wordpress/icons';
import {
	useTracker,
	getFailureCount as getTrackedFailureCount,
} from './tracker';
import { unlock } from '../../lock-unlock';

const NOTICE_ID = 'upload-progress';

// How long the completion checkmark is shown before the snackbar dismisses.
const COMPLETION_DISPLAY_MS = 3000;

// Longest filename shown before it is middle-truncated. Long names (e.g. the
// UUID-style names some sources produce) would otherwise stretch the snackbar.
const MAX_FILENAME_LENGTH = 40;

interface QueueItem {
	id: string;
	parentId?: string;
	sourceFile?: { name?: string };
}

const EMPTY_ITEMS: QueueItem[] = [];

/**
 * Module-level controller coordination so multiple `<UploadProgressSnackbar />`
 * instances can be mounted simultaneously (for example, when a page mounts
 * several `MediaEdit` fields or mounts `MediaEdit` alongside an editor canvas)
 * without duplicate notices or duplicate `wp.a11y.speak()` announcements, and
 * with seamless ownership handoff when one instance unmounts while another
 * remains mounted.
 */
const mountedInstances = new Set< symbol >();
const leaderListeners = new Set< () => void >();
const sharedController = {
	peak: 0,
	dismissed: false,
	wasUploading: false,
	failuresAtStart: 0,
	completionTimeout: null as ReturnType< typeof setTimeout > | null,
};

function resetSharedController() {
	if ( sharedController.completionTimeout ) {
		clearTimeout( sharedController.completionTimeout );
		sharedController.completionTimeout = null;
	}
	sharedController.peak = 0;
	sharedController.dismissed = false;
	sharedController.wasUploading = false;
	sharedController.failuresAtStart = 0;
}

function getLeaderId(): symbol | undefined {
	return mountedInstances.values().next().value;
}

function subscribeLeader( listener: () => void ) {
	leaderListeners.add( listener );
	return () => {
		leaderListeners.delete( listener );
	};
}

function notifyLeaderChange() {
	leaderListeners.forEach( ( listener ) => listener() );
}

/**
 * Middle-truncates a filename that exceeds `MAX_FILENAME_LENGTH`, keeping the
 * start and the end (so the file extension stays visible).
 *
 * @param filename The filename to truncate.
 * @return The original or middle-truncated filename.
 */
function truncateFilename( filename: string ): string {
	if ( filename.length <= MAX_FILENAME_LENGTH ) {
		return filename;
	}
	const ellipsis = '…';
	const visible = MAX_FILENAME_LENGTH - ellipsis.length;
	const front = Math.ceil( visible / 2 );
	const back = Math.floor( visible / 2 );
	return (
		filename.slice( 0, front ) +
		ellipsis +
		filename.slice( filename.length - back )
	);
}

// Exported so the Storybook story can render the exact icon markup the notice
// uses, keeping the visual review faithful to what ships.
export const UPLOAD_SPINNER = (
	<span
		className="editor-upload-progress-snackbar__spinner"
		aria-hidden="true"
	>
		<WCSpinner />
	</span>
);

export const UPLOAD_DONE = (
	<span className="editor-upload-progress-snackbar__check" aria-hidden="true">
		<WCIcon icon={ check } />
	</span>
);

/**
 * Manages a snackbar notice that shows media upload progress while uploads are
 * in progress. It creates/updates a notice via the notices store so that it
 * positions and stacks with every other snackbar on the screen.
 *
 * Reads from two sources to cover both upload paths:
 *  - `@wordpress/upload-media` store (client-side media processing path).
 *  - An in-memory tracker populated by `uploadMedia()` in `@wordpress/media-utils`
 *    (traditional / non-CSM path — e.g. Safari, or when a filter disables CSM).
 *
 * Only counts original user-uploaded files (items without a `parentId`),
 * ignoring generated subsizes/thumbnails.
 *
 * @return This component renders nothing — it only manages a notice.
 */
export default function UploadProgressSnackbar() {
	const [ instanceId ] = useState( () => Symbol( 'UploadProgressSnackbar' ) );

	const leaderId = useSyncExternalStore(
		subscribeLeader,
		getLeaderId,
		getLeaderId
	);
	const isLeader = leaderId === undefined || leaderId === instanceId;

	const { items, csmFailureCount } = useSelect( ( select ) => {
		const storeSelect = select( uploadStore ) as
			{ getItems?: () => QueueItem[] } | undefined;
		if ( ! storeSelect || typeof storeSelect.getItems !== 'function' ) {
			return {
				items: EMPTY_ITEMS,
				csmFailureCount: 0,
			};
		}
		const unlocked = unlock( storeSelect ) as
			{ getFailureCount?: () => number } | undefined;
		return {
			items: storeSelect.getItems(),
			csmFailureCount:
				typeof unlocked?.getFailureCount === 'function'
					? unlocked.getFailureCount()
					: 0,
		};
	}, [] );
	const tracker = useTracker();

	// CSM path: originals in the upload-media queue (subsizes excluded). Memoized
	// so its reference is stable across renders where `items` is unchanged, since
	// it's a dependency of the effect below.
	const csmOriginals = useMemo(
		() => items.filter( ( item ) => ! item.parentId ),
		[ items ]
	);
	const csmRemaining = csmOriginals.length;

	// Non-CSM path: files tracked by `uploadMedia()`.
	const trackedRemaining = tracker ? tracker.total - tracker.completed : 0;

	const remaining = csmRemaining + trackedRemaining;

	// Track peak total across sources during a session. The CSM queue removes
	// items on completion, and the tracker tops out at its recorded total, so
	// `total` has to be tracked as the high-water mark. Held outside React state
	// (updated inside the effect below) because it never drives rendering -
	// setting state during render here discarded the in-progress render pass,
	// which corrupted `useSyncExternalStore`'s snapshot bookkeeping and made it
	// drop the tracker's completion notification, leaving the snackbar stuck in
	// its uploading state (see gutenberg#80343).
	const sessionTotal = csmRemaining + ( tracker ? tracker.total : 0 );

	const { createNotice, removeNotice } = useDispatch( noticesStore );

	// Register this instance and remove the notice only when the last mounted
	// instance unmounts. If another instance is still mounted, hand leadership
	// over to it so an active upload notice continues uninterrupted.
	useEffect( () => {
		const wasLeader = mountedInstances.size === 0;
		mountedInstances.add( instanceId );
		if ( wasLeader ) {
			notifyLeaderChange();
		}

		return () => {
			const wasCurrentLeader = getLeaderId() === instanceId;
			mountedInstances.delete( instanceId );
			if ( mountedInstances.size === 0 ) {
				resetSharedController();
				removeNotice( NOTICE_ID );
			} else if ( wasCurrentLeader ) {
				notifyLeaderChange();
			}
		};
	}, [ instanceId, removeNotice ] );

	useEffect( () => {
		if ( ! isLeader ) {
			return;
		}

		const isUploading = remaining > 0;
		const failures = csmFailureCount + getTrackedFailureCount();

		if ( isUploading && ! sharedController.wasUploading ) {
			sharedController.dismissed = false;
			sharedController.failuresAtStart = failures;
			speak( __( 'Media upload started' ), 'polite' );
			// A new batch started during the completion display: cancel the
			// pending dismissal so the snackbar transitions straight back
			// into the uploading state, and reset the peak so the new batch
			// counts from `1 of N` rather than resuming the previous total.
			if ( sharedController.completionTimeout ) {
				clearTimeout( sharedController.completionTimeout );
				sharedController.completionTimeout = null;
				sharedController.peak = 0;
			}
		} else if ( ! isUploading && sharedController.wasUploading ) {
			// The queue drains the same way whether an item uploaded or
			// failed, so the batch is only "complete" for the files that
			// actually made it (see gutenberg#81132).
			const total = sharedController.peak;
			const failed = Math.min(
				total,
				failures - sharedController.failuresAtStart
			);
			const uploaded = total - failed;

			if ( uploaded === 0 ) {
				// Nothing uploaded: the per-file errors already say so, and a
				// completion snackbar next to them would contradict them. Take
				// down the progress notice rather than replacing it.
				speak( __( 'Media upload failed' ), 'polite' );
				removeNotice( NOTICE_ID );
				sharedController.peak = 0;
			} else {
				const isFullSuccess = failed === 0;
				const content = isFullSuccess
					? __( 'Upload complete' )
					: sprintf(
							/* translators: 1: number of files uploaded, 2: number of files in the batch. */
							__( 'Uploaded %1$d of %2$d' ),
							uploaded,
							total
						);

				speak(
					isFullSuccess ? __( 'Media upload complete' ) : content,
					'polite'
				);

				if ( ! sharedController.dismissed ) {
					createNotice( 'info', content, {
						id: NOTICE_ID,
						type: 'snackbar',
						isDismissible: false,
						explicitDismiss: false,
						speak: false,
						// No checkmark on a partial batch — some of it failed.
						icon: ( isFullSuccess
							? UPLOAD_DONE
							: undefined ) as unknown as string | undefined,
						onDismiss: () => {
							sharedController.dismissed = true;
						},
					} );

					sharedController.completionTimeout = setTimeout( () => {
						removeNotice( NOTICE_ID );
						sharedController.completionTimeout = null;
						sharedController.peak = 0;
					}, COMPLETION_DISPLAY_MS );
				} else {
					sharedController.peak = 0;
				}
			}
		}

		sharedController.wasUploading = isUploading;

		if ( ! isUploading || sharedController.dismissed ) {
			return;
		}

		if ( sessionTotal > sharedController.peak ) {
			sharedController.peak = sessionTotal;
		}

		const total = sharedController.peak;
		const current = total - remaining + 1;

		// Prefer the CSM queue's first original filename, then fall back to
		// the tracker's first pending filename.
		const filename = truncateFilename(
			csmOriginals[ 0 ]?.sourceFile?.name ||
				tracker?.pending[ 0 ] ||
				__( 'Uploading' )
		);

		const content =
			total === 1
				? sprintf(
						/* translators: %s: filename. */
						__( 'Uploading — %s' ),
						filename
					)
				: sprintf(
						/* translators: 1: current upload number, 2: total uploads, 3: filename. */
						__( 'Uploading %1$d of %2$d — %3$s' ),
						current,
						total,
						filename
					);

		createNotice( 'info', content, {
			id: NOTICE_ID,
			type: 'snackbar',
			isDismissible: false,
			explicitDismiss: true,
			speak: false,
			icon: UPLOAD_SPINNER as unknown as string,
			onDismiss: () => {
				sharedController.dismissed = true;
			},
		} );
	}, [
		isLeader,
		remaining,
		sessionTotal,
		csmOriginals,
		csmFailureCount,
		tracker,
		createNotice,
		removeNotice,
	] );

	return null;
}
