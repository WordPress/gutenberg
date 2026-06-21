/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * React hook used to compute the media upload settings to use in the post editor.
 *
 * @param {Object} settings Media upload settings prop.
 *
 * @return {Object} Media upload settings.
 */
function useMediaUploadSettings( settings = {} ) {
	return useMemo(
		() => ( {
			mediaUpload: settings.mediaUpload,
			mediaSideload: settings.mediaSideload,
			mediaFinalize: settings.mediaFinalize,
			mediaDelete: settings.mediaDelete,
			maxUploadFileSize: settings.maxUploadFileSize,
			allowedMimeTypes: settings.allowedMimeTypes,
			allImageSizes: settings.allImageSizes,
			bigImageSizeThreshold: settings.bigImageSizeThreshold,
			/*
			 * Developer opt-out for keeping the original video upload, exposed
			 * by lib/media/video-transcoding.php. When false, videos are
			 * transcoded before upload so only the optimized file is stored.
			 */
			videoKeepOriginal:
				typeof window !== 'undefined'
					? window.__videoTranscodingKeepOriginal
					: undefined,
		} ),
		[ settings ]
	);
}

export default useMediaUploadSettings;
