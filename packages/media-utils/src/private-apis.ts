import { sideloadMedia } from './utils/sideload-media';
import { MediaUploadModal } from './components/media-upload-modal';
import MediaEdit, { MediaEditControl } from './components/media-edit';
import { lock } from './lock-unlock';

/**
 * Private @wordpress/media-utils APIs.
 */
export const privateApis = {};

lock( privateApis, {
	sideloadMedia,
	MediaUploadModal,
	MediaEdit,
	MediaEditControl,
} );
