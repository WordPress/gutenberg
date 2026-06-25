/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { uploadMedia } from '@wordpress/media-utils';
import { isClientSideMediaSupported } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	addFiles as trackStart,
	advance as trackAdvance,
} from '../../components/upload-progress-snackbar/tracker';

const noop = () => {};

/**
 * Upload a media file when the file upload button is activated.
 * Wrapper around uploadMedia() that injects the current post ID.
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
} ) {
	const { receiveEntityRecords } = dispatch( coreDataStore );
	const { getCurrentPost, getEditorSettings } = select( editorStore );
	const {
		lockPostAutosaving,
		unlockPostAutosaving,
		lockPostSaving,
		unlockPostSaving,
	} = dispatch( editorStore );

	const wpAllowedMimeTypes = getEditorSettings().allowedMimeTypes;
	const isClientSideMediaActive =
		window.__clientSideMediaProcessing && isClientSideMediaSupported();
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

	// Lock saving immediately when the upload starts.
	// When client-side media processing is enabled, save locking
	// is handled by useUploadSaveLock in the editor provider.
	if ( ! isClientSideMediaActive ) {
		lockPostSaving( lockKey );
		lockPostAutosaving( lockKey );
	}

	const postData = currentPostId ? { post: currentPostId } : {};

	// Track this batch for the upload progress snackbar. Only applies to the
	// non-CSM path — when CSM is enabled, the block-editor provider intercepts
	// mediaUpload and dispatches to the upload-media store, so this wrapper is
	// not called.
	if ( ! isClientSideMediaActive ) {
		const trackingFiles = Array.from( filesList ).map(
			( f ) => f?.name || ''
		);
		trackStart( trackingFiles );
	}
	let lastCompletedCount = 0;

	uploadMedia( {
		allowedTypes,
		filesList,
		onFileChange: ( files ) => {
			onFileChange?.( files );

			// Files are initially received by `onFileChange` as a blob.
			// After that the function is called again with the file as an entity.
			// For core-data, we only care about receiving/invalidating entities.
			const entityFiles = files.filter( ( _file ) => _file?.id );
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
				! isClientSideMediaActive &&
				entityFiles.length === files.length
			) {
				clearSaveLock();
			}

			// Advance the snackbar tracker for newly-completed files.
			if ( ! isClientSideMediaActive ) {
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
			if ( ! isClientSideMediaActive ) {
				clearSaveLock();
				// Failed files still count as "done" for the snackbar.
				trackAdvance( 1 );
			}
			onError( message );
		},
		wpAllowedMimeTypes,
		multiple,
	} );
}
