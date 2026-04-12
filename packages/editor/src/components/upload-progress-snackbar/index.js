/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { store as uploadStore } from '@wordpress/upload-media';
import { store as noticesStore } from '@wordpress/notices';

const NOTICE_ID = 'upload-progress';

/**
 * Manages a snackbar notice that shows media upload progress while uploads are
 * in progress. It creates/updates a notice via the notices store so that it
 * positions and stacks with every other snackbar in the editor.
 *
 * Only counts original user-uploaded files (items without a `parentId`),
 * ignoring generated subsizes/thumbnails.
 *
 * Gated by the `window.__clientSideMediaProcessing` runtime flag.
 *
 * @return {null} This component renders nothing — it only manages a notice.
 */
export default function UploadProgressSnackbar() {
	const isClientSideMediaProcessingEnabled =
		window.__clientSideMediaProcessing;

	const items = useSelect(
		( select ) => {
			if ( ! isClientSideMediaProcessingEnabled ) {
				return [];
			}
			return select( uploadStore ).getItems();
		},
		[ isClientSideMediaProcessingEnabled ]
	);

	// Only count original user uploads, not generated subsizes/thumbnails.
	const originals = items.filter( ( item ) => ! item.parentId );
	const remaining = originals.length;

	// Track peak original count during a session. Items are removed from the
	// queue on completion, so `total` has to be tracked separately.
	const peakRef = useRef( 0 );
	if ( remaining > peakRef.current ) {
		peakRef.current = remaining;
	}

	const { createNotice, removeNotice } = useDispatch( noticesStore );

	// Track whether the user has dismissed the notice. If so, don't re-create
	// it until the current batch finishes and a new one starts.
	const dismissedRef = useRef( false );

	// Announce start and completion transitions, and manage the notice.
	const wasUploadingRef = useRef( false );
	useEffect( () => {
		if ( ! isClientSideMediaProcessingEnabled ) {
			return;
		}

		const isUploading = remaining > 0;

		if ( isUploading && ! wasUploadingRef.current ) {
			// New batch started — reset state.
			dismissedRef.current = false;
			speak( __( 'Media upload started' ), 'polite' );
		} else if ( ! isUploading && wasUploadingRef.current ) {
			// Batch finished.
			speak( __( 'Media upload complete' ), 'polite' );
			removeNotice( NOTICE_ID );
			peakRef.current = 0;
		}

		wasUploadingRef.current = isUploading;

		if ( ! isUploading || dismissedRef.current ) {
			return;
		}

		const total = peakRef.current;
		const current = total - remaining + 1;
		const filename = originals[ 0 ]?.sourceFile?.name || __( 'Uploading' );

		const content = sprintf(
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
			onDismiss: () => {
				dismissedRef.current = true;
			},
		} );
	}, [
		remaining,
		isClientSideMediaProcessingEnabled,
		originals,
		createNotice,
		removeNotice,
	] );

	return null;
}
