import { useMemo } from '@wordpress/element';
import type { Settings } from '../../store/types';

/**
 * React hook used to compute the media upload settings to use in the post editor.
 *
 * @param settings Media upload settings prop.
 *
 * @return Media upload settings.
 */
function useMediaUploadSettings( settings: Settings = {} ) {
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
			imageStripMeta: settings.imageStripMeta,
			imageMaxBitDepth: settings.imageMaxBitDepth,
			generateAnimatedImageSubsizes:
				settings.generateAnimatedImageSubsizes,
		} ),
		[ settings ]
	);
}

export default useMediaUploadSettings;
