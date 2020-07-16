/**
 * External dependencies
 */
import { get, pick } from 'lodash';

export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
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

export function getImageRatio( img ) {
	if ( ! img ) {
		return false;
	}

	if ( ! img.naturalWidth || ! img.naturalHeight ) {
		return false;
	}

	const ratio = img.naturalWidth / img.naturalHeight;

	if ( ratio < 0.5 ) {
		return 'tall';
	} else if ( ratio < 0.9 ) {
		return 'portrait';
	} else if ( ratio < 1.1 ) {
		return 'square';
	} else if ( ratio < 1.9 ) {
		return 'landscape';
	}

	return 'wide';
}
