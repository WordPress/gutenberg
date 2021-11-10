/**
 * External dependencies
 */
import { get, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

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

export function isGalleryV2Enabled() {
	if ( typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ) {
		return true;
	}

	if ( Platform.isWeb && window.wp.galleryBlockV2Enabled ) {
		return true;
	}

	const settings = select( blockEditorStore ).getSettings();
	if ( settings.__unstableGalleryWithImageBlocks ) {
		return true;
	}

	return false;
}
