/**
 * WordPress dependencies
 */
import { getBlobTypeByURL, isBlobURL } from '@wordpress/blob';

const POSITION_CLASSNAMES = {
	'top left': 'is-position-top-left',
	'top center': 'is-position-top-center',
	'top right': 'is-position-top-right',
	'center left': 'is-position-center-left',
	'center center': 'is-position-center-center',
	center: 'is-position-center-center',
	'center right': 'is-position-center-right',
	'bottom left': 'is-position-bottom-left',
	'bottom center': 'is-position-bottom-center',
	'bottom right': 'is-position-bottom-right',
};

export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';
export const COVER_MIN_HEIGHT = 50;
export const COVER_MAX_HEIGHT = 1000;
export const COVER_DEFAULT_HEIGHT = 300;
export const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };
export const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export function mediaPosition( { x, y } = DEFAULT_FOCAL_POINT ) {
	return `${ Math.round( x * 100 ) }% ${ Math.round( y * 100 ) }%`;
}

export function dimRatioToClass( ratio ) {
	return ratio === 50 || ratio === undefined
		? null
		: 'has-background-dim-' + 10 * Math.round( ratio / 10 );
}

export function attributesFromMedia( media ) {
	if ( ! media || ( ! media.url && ! media.src ) ) {
		return {
			url: undefined,
			id: undefined,
		};
	}

	if ( isBlobURL( media.url ) ) {
		media.type = getBlobTypeByURL( media.url );
	}

	let mediaType;
	// For media selections originated from a file upload.
	if ( media.media_type ) {
		if ( media.media_type === IMAGE_BACKGROUND_TYPE ) {
			mediaType = IMAGE_BACKGROUND_TYPE;
		} else {
			// Only images and videos are accepted so if the media_type is not an image we can assume it is a video.
			// Videos contain the media type of 'file' in the object returned from the rest api.
			mediaType = VIDEO_BACKGROUND_TYPE;
		}
		// For media selections originated from existing files in the media library.
	} else if (
		media.type &&
		( media.type === IMAGE_BACKGROUND_TYPE ||
			media.type === VIDEO_BACKGROUND_TYPE )
	) {
		mediaType = media.type;
	} else {
		return;
	}

	return {
		url: media.url || media.src,
		id: media.id,
		alt: media?.alt,
		backgroundType: mediaType,
		...( mediaType === VIDEO_BACKGROUND_TYPE
			? { hasParallax: undefined }
			: {} ),
	};
}

/**
 * Checks of the contentPosition is the center (default) position.
 *
 * @param {string} contentPosition The current content position.
 * @return {boolean} Whether the contentPosition is center.
 */
export function isContentPositionCenter( contentPosition ) {
	return (
		! contentPosition ||
		contentPosition === 'center center' ||
		contentPosition === 'center'
	);
}

/**
 * Retrieves the className for the current contentPosition.
 * The default position (center) will not have a className.
 *
 * @param {string} contentPosition The current content position.
 * @return {string} The className assigned to the contentPosition.
 */
export function getPositionClassName( contentPosition ) {
	/*
	 * Only render a className if the contentPosition is not center (the default).
	 */
	if ( isContentPositionCenter( contentPosition ) ) {
		return '';
	}

	return POSITION_CLASSNAMES[ contentPosition ];
}
