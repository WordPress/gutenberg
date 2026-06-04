/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { store as uploadStore } from '@wordpress/upload-media';
import { store as noticesStore } from '@wordpress/notices';
import { Icon as WCIcon, Spinner } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useTracker } from './tracker';

const NOTICE_ID = 'upload-progress';

// How long the completion checkmark is shown before the snackbar dismisses.
const COMPLETION_DISPLAY_MS = 3000;

// Longest filename shown before it is middle-truncated. Long names (e.g. the
// UUID-style names some sources produce) would otherwise stretch the snackbar.
const MAX_FILENAME_LENGTH = 40;

/**
 * Middle-truncates a filename that exceeds `MAX_FILENAME_LENGTH`, keeping the
 * start and the end (so the file extension stays visible).
 *
 * @param {string} filename The filename to truncate.
 * @return {string} The original or middle-truncated filename.
 */
function truncateFilename( filename ) {
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
		<Spinner />
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
 * positions and stacks with every other snackbar in the editor.
 *
 * Reads from two sources to cover both upload paths:
 *  - `@wordpress/upload-media` store (client-side media processing path).
 *  - An editor-local tracker populated by the traditional `mediaUpload`
 *    wrapper (non-CSM path — e.g. Safari, or when a filter disables CSM).
 *
 * Only counts original user-uploaded files (items without a `parentId`),
 * ignoring generated subsizes/thumbnails.
 *
 * @return {null} This component renders nothing — it only manages a notice.
 */
export default function UploadProgressSnackbar() {
	const items = useSelect(
		( select ) => select( uploadStore ).getItems(),
		[]
	);
	const tracker = useTracker();

	// CSM path: originals in the upload-media queue (subsizes excluded). Memoized
	// so its reference is stable across renders where `items` is unchanged, since
	// it's a dependency of the effect below.
	const csmOriginals = useMemo(
		() => items.filter( ( item ) => ! item.parentId ),
		[ items ]
	);
	const csmRemaining = csmOriginals.length;

	// Non-CSM path: files tracked by the editor's mediaUpload wrapper.
	const trackedRemaining = tracker ? tracker.total - tracker.completed : 0;

	const remaining = csmRemaining + trackedRemaining;

	// Track peak total across sources during a session. The CSM queue removes
	// items on completion, and the tracker tops out at its recorded total, so
	// `total` has to be tracked as the high-water mark.
	const [ peak, setPeak ] = useState( 0 );
	const sessionTotal = csmRemaining + ( tracker ? tracker.total : 0 );
	if ( sessionTotal > peak ) {
		setPeak( sessionTotal );
	}

	const { createNotice, removeNotice } = useDispatch( noticesStore );

	// Track whether the user has dismissed the notice. If so, don't re-create
	// it until the current batch finishes and a new one starts.
	const dismissedRef = useRef( false );
	const wasUploadingRef = useRef( false );

	// Timeout that removes the completion-state (checkmark) notice after a
	// brief display. Held so a new upload can cancel it.
	const completionTimeoutRef = useRef( null );
	useEffect( () => {
		return () => {
			if ( completionTimeoutRef.current ) {
				clearTimeout( completionTimeoutRef.current );
			}
		};
	}, [] );

	useEffect( () => {
		const isUploading = remaining > 0;

		if ( isUploading && ! wasUploadingRef.current ) {
			dismissedRef.current = false;
			speak( __( 'Media upload started' ), 'polite' );
			// A new batch started during the completion display: cancel the
			// pending dismissal so the snackbar transitions straight back
			// into the uploading state, and reset the peak so the new batch
			// counts from `1 of N` rather than resuming the previous total.
			if ( completionTimeoutRef.current ) {
				clearTimeout( completionTimeoutRef.current );
				completionTimeoutRef.current = null;
				setPeak( 0 );
			}
		} else if ( ! isUploading && wasUploadingRef.current ) {
			speak( __( 'Media upload complete' ), 'polite' );

			if ( ! dismissedRef.current ) {
				createNotice( 'info', __( 'Upload complete' ), {
					id: NOTICE_ID,
					type: 'snackbar',
					isDismissible: false,
					explicitDismiss: false,
					speak: false,
					icon: UPLOAD_DONE,
					onDismiss: () => {
						dismissedRef.current = true;
					},
				} );

				completionTimeoutRef.current = setTimeout( () => {
					removeNotice( NOTICE_ID );
					completionTimeoutRef.current = null;
					setPeak( 0 );
				}, COMPLETION_DISPLAY_MS );
			} else {
				setPeak( 0 );
			}
		}

		wasUploadingRef.current = isUploading;

		if ( ! isUploading || dismissedRef.current ) {
			return;
		}

		const total = peak;
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
			icon: UPLOAD_SPINNER,
			onDismiss: () => {
				dismissedRef.current = true;
			},
		} );
	}, [ remaining, peak, csmOriginals, tracker, createNotice, removeNotice ] );

	return null;
}
