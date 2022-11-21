/**
 * External dependencies
 */
import { get } from 'lodash';

export const pickRelevantMediaFiles = ( image, sizeSlug = 'large' ) => {
	const { alt, id, link, caption } = image;
	const imageProps = { alt, id, link, caption };

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
