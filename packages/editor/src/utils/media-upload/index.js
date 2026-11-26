import { v4 as uuid } from 'uuid';
import { select, dispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { uploadMedia } from '@wordpress/media-utils';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '../../store';
import {
	addFiles as trackStart,
	advance as trackAdvance,
	advanceFailed as trackFailure,
} from '../../components/upload-progress-snackbar/tracker';
import { createUploadQueue } from './upload-queue';

const noop = () => {};

/**
 * Maximum number of `mediaUpload()` calls sending files to the server at once.
 *
 * Blocks such as Gallery and Playlist upload each file through a call of its
 * own, so without a limit across calls, adding ten images sends ten
 * `POST /wp/v2/media` requests at once. Each of them has the server generate
 * every image sub-size, which can exhaust a small pool of PHP workers and fail
 * with 502 errors (see gutenberg#87191).
 *
 * Matches `DEFAULT_MAX_CONCURRENT_IMAGE_PROCESSING` in `@wordpress/upload-media`,
 * which is internal to that package's store and not exported. Two rather than
 * one, so that one large file does not hold up every upload queued behind it.
 */
const MAX_CONCURRENT_UPLOADS = 2;

const enqueueUpload = createUploadQueue( MAX_CONCURRENT_UPLOADS );

/**
 * Upload a media file when the file upload button is activated.
 * Wrapper around uploadMedia() that injects the current post ID.
 *
 * At most two calls upload at once; later calls wait for a free slot. Calls
 * with `isTransportOnly` set skip that limit, because the
 * `@wordpress/upload-media` queue making them applies its own.
 *
 * @param {Object}   $0                   Parameters object passed to the function.
 * @param {?Object}  $0.additionalData    Additional data to include in the request.
 * @param {string}   $0.allowedTypes      Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param {Array}    $0.filesList         List of files.
 * @param {?number}  $0.maxUploadFileSize Maximum upload size in bytes allowed for the site.
 * @param {Function} $0.onError           Function called when an error happens.
 * @param {Function} $0.onFileChange      Function called each time a file or a temporary representation of the file is available.
 * @param {Function} $0.onSuccess         Function called after the final representation of the file is available.
 * @param {boolean}  $0.multiple          Whether to allow multiple files to be uploaded.
 * @param {boolean}  $0.isTransportOnly   Whether the caller owns the upload lifecycle UX (progress tracking and
 *                                        save locking) and uses this function only as its server transport. Set
 *                                        by the `@wordpress/upload-media` queue, which counts its own items for
 *                                        the progress snackbar and locks saving via `useUploadSaveLock`.
 */
export default function mediaUpload( {
	additionalData = {},
	allowedTypes,
	filesList,
	maxUploadFileSize,
	onError = noop,
	onFileChange,
	onSuccess,
	multiple = true,
	isTransportOnly = false,
} ) {
	// A caller that takes a single file refuses a multi-file batch outright.
	// `uploadMedia()` makes the same check, but reports the refusal as one
	// error for the whole batch, which would leave every other file in it
	// counted as still in flight by the progress tracker below - and the
	// tracker folds every later upload into that stuck session
	// (see gutenberg#82041). Refusing here keeps the batch out of it.
	if ( ! multiple && filesList.length > 1 ) {
		onError( __( 'Only one file can be used here.' ) );
		return;
	}

	const { receiveEntityRecords } = dispatch( coreDataStore );
	const { getCurrentPost, getEditorSettings } = select( editorStore );
	const {
		lockPostAutosaving,
		unlockPostAutosaving,
		lockPostSaving,
		unlockPostSaving,
	} = dispatch( editorStore );

	const wpAllowedMimeTypes = getEditorSettings().allowedMimeTypes;
	const lockKey = `image-upload-${ uuid() }`;
	maxUploadFileSize =
		maxUploadFileSize || getEditorSettings().maxUploadFileSize;
	const currentPost = getCurrentPost();
	// Templates and template parts' numerical ID is stored in `wp_id`.
	const currentPostId =
		typeof currentPost?.id === 'number'
			? currentPost.id
			: currentPost?.wp_id;
	const clearSaveLock = () => {
		unlockPostSaving( lockKey );
		unlockPostAutosaving( lockKey );
	};

	// Lock saving immediately when the upload starts. Skipped for transport
	// calls from the `@wordpress/upload-media` queue, whose items already
	// lock saving via useUploadSaveLock in the editor provider.
	//
	// A call still waiting for an upload slot is locked and tracked too: its
	// blocks already show the files, typically under temporary blob URLs that
	// must not be saved, and to the user the upload has started.
	if ( ! isTransportOnly ) {
		lockPostSaving( lockKey );
		lockPostAutosaving( lockKey );
	}

	const postData = currentPostId ? { post: currentPostId } : {};

	// Track this batch for the upload progress snackbar. Skipped for
	// transport calls from the `@wordpress/upload-media` queue — its items
	// are already counted by the snackbar, so registering them here would
	// double-count them (see gutenberg#80369).
	if ( ! isTransportOnly ) {
		const trackingFiles = Array.from( filesList ).map(
			( f ) => f?.name || ''
		);
		trackStart( trackingFiles );
	}
	let lastCompletedCount = 0;

	/**
	 * Sends the files to the server.
	 *
	 * @param {() => void} releaseSlot Frees this call's upload slot. A no-op
	 *                                 for transport calls, which never take one.
	 */
	const startUpload = ( releaseSlot = noop ) => {
		// The slot is held until every file in the call has either finished
		// uploading or failed. Releasing it on the first error would let the
		// next call start while the rest of a mixed batch is still uploading.
		let settledCompletedCount = 0;
		let failedCount = 0;
		const releaseSlotIfSettled = () => {
			if ( settledCompletedCount + failedCount >= filesList.length ) {
				releaseSlot();
			}
		};

		try {
			uploadMedia( {
				allowedTypes,
				filesList,
				onFileChange: ( files ) => {
					// Files are initially received by `onFileChange` as a blob.
					// After that the function is called again with the file as an entity.
					// For core-data, we only care about receiving/invalidating entities.
					const entityFiles = files.filter( ( _file ) => _file?.id );

					// Settled before any callback runs, so a callback that
					// throws cannot keep the slot held.
					settledCompletedCount = Math.max(
						settledCompletedCount,
						entityFiles.length
					);
					releaseSlotIfSettled();

					onFileChange?.( files );

					if ( entityFiles?.length ) {
						const invalidateCache = true;
						receiveEntityRecords(
							'postType',
							'attachment',
							entityFiles,
							undefined,
							invalidateCache
						);
					}

					// Unlock saving once all files have been uploaded (all have IDs).
					if (
						! isTransportOnly &&
						entityFiles.length === files.length
					) {
						clearSaveLock();
					}

					// Advance the snackbar tracker for newly-completed files.
					if ( ! isTransportOnly ) {
						const completedCount = entityFiles.length;
						if ( completedCount > lastCompletedCount ) {
							trackAdvance( completedCount - lastCompletedCount );
							lastCompletedCount = completedCount;
						}
					}
				},
				onSuccess,
				additionalData: {
					...postData,
					...additionalData,
				},
				maxUploadFileSize,
				onError: ( { message } ) => {
					// Each error is for one file, whether it was rejected
					// before uploading (type or size) or failed on the server.
					failedCount++;
					releaseSlotIfSettled();

					if ( ! isTransportOnly ) {
						clearSaveLock();
						// Failed files still count as "done" for the snackbar, but are
						// tallied so it doesn't report a batch that failed outright as
						// an upload that completed.
						trackFailure( 1 );
					}
					onError( message );
				},
				wpAllowedMimeTypes,
				multiple,
			} );
		} catch ( error ) {
			if ( isTransportOnly ) {
				throw error;
			}

			// A queued call can start from inside another call's callback,
			// where a throw would surface as an error of that other upload.
			// So the call is failed here instead: every file it has not yet
			// settled counts as failed, and its slot and save lock are freed.
			const unsettledCount =
				filesList.length - settledCompletedCount - failedCount;
			failedCount = filesList.length;
			releaseSlot();
			clearSaveLock();
			if ( unsettledCount > 0 ) {
				trackFailure( unsettledCount );
			}
			onError(
				typeof error?.message === 'string' && error.message
					? error.message
					: __( 'Upload failed, try again.' )
			);
			return;
		}

		// Covers a call with no files, which never reports a settled file.
		releaseSlotIfSettled();
	};

	if ( isTransportOnly ) {
		startUpload();
	} else {
		enqueueUpload( startUpload );
	}
}
