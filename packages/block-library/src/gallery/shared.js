/**
 * External dependencies
 */
import { get, pick } from 'lodash';

export function defaultColumnsNumber( imageCount ) {
	return imageCount ? Math.min( 3, imageCount ) : 3;
}

export const pickRelevantMediaFiles = ( image, sizeSlug = 'large' ) => {
	const imageProps = pick( image, [ 'alt', 'id', 'link', 'caption' ] );
	imageProps.url =
		get( image, [ 'sizes', sizeSlug, 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] ) ||
		image.url;
	const fullUrl =
		get( image, [ 'sizes', 'full', 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', 'full', 'source_url' ] );
	if ( fullUrl ) {
		imageProps.fullUrl = fullUrl;
	}
	return imageProps;
};

/**
 * The new gallery block format is not compatible with the use_BalanceTags option
 * in WP versions <= 5.8 https://core.trac.wordpress.org/ticket/54130. The
 * window.wp.galleryBlockV2Enabled flag is set in lib/compat.php. This method
 * can be removed when minimum supported WP version >=5.9.
 */
export function isGalleryV2Enabled() {
	// Only run the Gallery version compat check if the plugin is running, otherwise
	// assume we are in 5.9 core and enable by default.
	if ( process.env.IS_GUTENBERG_PLUGIN ) {
		// We want to fail early here, at least during beta testing phase, to ensure
		// there aren't instances where undefined values cause false negatives.
		if (
			! window.wp ||
			typeof window.wp.galleryBlockV2Enabled !== 'boolean'
		) {
			throw 'window.wp.galleryBlockV2Enabled is not defined';
		}
		return window.wp.galleryBlockV2Enabled;
	}

	return true;
}
