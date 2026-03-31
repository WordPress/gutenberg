/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';
import { store as uploadMediaStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/**
 * Hook that announces upload status changes for screen readers.
 *
 * Uses wp.a11y.speak to make announcements when:
 * - Upload starts (polite)
 * - Upload completes successfully (polite)
 * - Upload fails with an error (assertive)
 *
 * @param {string}  url        The blob URL of the uploading image.
 * @param {boolean} isComplete Whether the upload is complete (no temporaryURL).
 * @param {string}  filename   Optional filename for more descriptive announcements.
 */
export default function useUploadAnnouncer( url, isComplete, filename = '' ) {
	const hasAnnouncedStart = useRef( false );
	const hasAnnouncedComplete = useRef( false );
	const previousErrorRef = useRef( null );
	const previousUrlRef = useRef( null );

	const { itemError, batchSize, batchIndex, isBatchComplete } = useSelect(
		( select ) => {
			if ( ! url ) {
				return {
					itemError: undefined,
					batchSize: undefined,
					batchIndex: undefined,
					isBatchComplete: false,
				};
			}

			const { getItemByBlobUrl, isBatchUploaded } = unlock(
				select( uploadMediaStore )
			);
			const item = getItemByBlobUrl( url );

			return {
				itemError: item?.error,
				batchSize: item?.batchSize,
				batchIndex: item?.batchIndex,
				isBatchComplete: item?.batchId
					? isBatchUploaded( item.batchId )
					: false,
			};
		},
		[ url ]
	);

	// Announce upload start.
	// For batches, only the first item announces (with total count).
	// Wait for batch metadata to be available before announcing.
	useEffect( () => {
		if ( ! url || hasAnnouncedStart.current ) {
			return;
		}

		// Wait for batch metadata to be populated from the store.
		if ( batchSize === undefined || batchIndex === undefined ) {
			return;
		}

		// Disable reason: Updating a ref is a standard React pattern for
		// tracking state across renders without causing re-renders.
		// eslint-disable-next-line react-compiler/react-compiler
		hasAnnouncedStart.current = true;

		// For batch uploads, only announce once from the first item.
		if ( batchSize > 1 && batchIndex > 1 ) {
			return;
		}

		let message;
		if ( batchSize > 1 ) {
			message = sprintf(
				/* translators: %d: number of images being uploaded */
				__( 'Uploading %d images…' ),
				batchSize
			);
		} else if ( filename ) {
			message = sprintf(
				/* translators: %s: filename */
				__( 'Uploading %s…' ),
				filename
			);
		} else {
			message = __( 'Uploading image…' );
		}
		speak( message, 'polite' );
	}, [ url, filename, batchSize, batchIndex ] );

	// Announce upload completion.
	// For single uploads, announce when isComplete is true.
	// For batch uploads, only the lead item (batchIndex === 1) announces,
	// and only after the entire batch is done (isBatchComplete).
	useEffect( () => {
		if ( ! hasAnnouncedStart.current || hasAnnouncedComplete.current ) {
			return;
		}

		// For batch uploads, non-lead items never announce completion.
		if ( batchSize > 1 && batchIndex > 1 ) {
			return;
		}

		// For batch uploads, wait until the entire batch is done.
		if ( batchSize > 1 && ! isBatchComplete ) {
			return;
		}

		// For single uploads, wait for this item to be complete.
		if ( ! isComplete && ! ( batchSize > 1 ) ) {
			return;
		}

		hasAnnouncedComplete.current = true;
		let message;
		if ( batchSize > 1 ) {
			message = sprintf(
				/* translators: %d: number of images uploaded */
				__( '%d images uploaded successfully.' ),
				batchSize
			);
		} else if ( filename ) {
			message = sprintf(
				/* translators: %s: filename */
				__( '%s uploaded successfully.' ),
				filename
			);
		} else {
			message = __( 'Image uploaded successfully.' );
		}
		speak( message, 'polite' );
	}, [ isComplete, filename, batchSize, batchIndex, isBatchComplete ] );

	// Announce errors.
	useEffect( () => {
		if ( itemError && previousErrorRef.current !== itemError ) {
			previousErrorRef.current = itemError;
			const message = itemError.message
				? sprintf(
						/* translators: %s: error message */
						__( 'Upload failed: %s' ),
						itemError.message
				  )
				: __( 'Upload failed.' );
			speak( message, 'assertive' );
		}
	}, [ itemError ] );

	// Reset announcements when URL genuinely changes (new upload).
	// Only reset when the URL changes from a prior value, not on initial mount,
	// to avoid undoing the start announcement ref set by the effect above.
	useEffect( () => {
		if (
			previousUrlRef.current !== null &&
			previousUrlRef.current !== url
		) {
			hasAnnouncedStart.current = false;
			hasAnnouncedComplete.current = false;
			previousErrorRef.current = null;
		}
		previousUrlRef.current = url;
	}, [ url ] );
}
