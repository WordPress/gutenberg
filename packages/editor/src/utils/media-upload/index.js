/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const noop = () => {};

/**
 * Upload a media file when the file upload button is activated.
 * Wrapper around mediaUpload() that injects the current post ID.
 *
 * @param {Object}   $0                   Parameters object passed to the function.
 * @param {?Object}  $0.additionalData    Additional data to include in the request.
 * @param {string}   $0.allowedTypes      Array with the types of media that can be uploaded, if unset all types are allowed.
 * @param {Array}    $0.filesList         List of files.
 * @param {?number}  $0.maxUploadFileSize Maximum upload size in bytes allowed for the site.
 * @param {Function} $0.onError           Function called when an error happens.
 * @param {Function} $0.onFileChange      Function called each time a file or a temporary representation of the file is available.
 */
export default function mediaUpload( {
	additionalData = {},
	allowedTypes,
	filesList,
	maxUploadFileSize,
	onError = noop,
	onFileChange,
} ) {
	const { getCurrentPost, getEditorSettings } = select( editorStore );
	const {
		lockPostAutosaving,
		unlockPostAutosaving,
		lockPostSaving,
		unlockPostSaving,
	} = dispatch( editorStore );

	const wpAllowedMimeTypes = getEditorSettings().allowedMimeTypes;
	const lockKey = `image-upload-${ uuid() }`;
	let imageIsUploading = false;
	maxUploadFileSize =
		maxUploadFileSize || getEditorSettings().maxUploadFileSize;
	const currentPost = getCurrentPost();
	// Templates and template parts' numerical ID is stored in `wp_id`.
	const currentPostId =
		typeof currentPost?.id === 'number'
			? currentPost.id
			: currentPost?.wp_id;
	const setSaveLock = () => {
		lockPostSaving( lockKey );
		lockPostAutosaving( lockKey );
		imageIsUploading = true;
	};

	const postData = currentPostId ? { post: currentPostId } : {};
	const clearSaveLock = () => {
		unlockPostSaving( lockKey );
		unlockPostAutosaving( lockKey );
		imageIsUploading = false;
	};

	uploadMedia( {
		allowedTypes,
		filesList,
		onFileChange: ( file ) => {
			if ( ! imageIsUploading ) {
				setSaveLock();
			} else {
				clearSaveLock();
			}
			onFileChange( file );
		},
		additionalData: {
			...postData,
			...additionalData,
		},
		maxUploadFileSize,
		onError: ( { message } ) => {
			clearSaveLock();
			onError( message );
		},
		wpAllowedMimeTypes,
	} );
}
