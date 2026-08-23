import { getBlobTypeByURL, isBlobURL } from '@wordpress/blob';
import { __, sprintf } from '@wordpress/i18n';

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
export const EMBED_VIDEO_BACKGROUND_TYPE = 'embed-video';
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

/**
 * Detects the media type from a URL by first checking the file extension,
 * then falling back to a HEAD request to check the Content-Type header.
 *
 * @param {string} url The URL to analyze.
 * @return {Promise<{type: string|null, error: string|null}>} Object containing the detected media type ('image' or 'video') or an error message.
 */
export async function getMediaTypeFromURL( url ) {
	if ( ! url ) {
		return { type: null, error: __( 'No URL provided.' ) };
	}

	// First, try to detect from file extension (fast path)
	const extensionType = getMediaTypeFromExtension( url );
	if ( extensionType ) {
		return { type: extensionType, error: null };
	}

	// Fall back to HEAD request to check Content-Type
	try {
		const response = await fetch( url, { method: 'HEAD' } );

		if ( ! response.ok ) {
			return {
				type: null,
				error: sprintf(
					/* translators: %d: HTTP status code */
					__( 'Unable to access the URL (HTTP %d).' ),
					response.status
				),
			};
		}

		const contentType = response.headers.get( 'Content-Type' ) || '';

		if ( contentType.startsWith( 'image/' ) ) {
			return { type: IMAGE_BACKGROUND_TYPE, error: null };
		}

		if ( contentType.startsWith( 'video/' ) ) {
			return { type: VIDEO_BACKGROUND_TYPE, error: null };
		}

		// Content-Type doesn't match image or video
		return {
			type: null,
			error: sprintf(
				/* translators: %s: Content-Type header value */
				__(
					'The URL does not point to a valid image or video file (Content-Type: %s).'
				),
				contentType || __( 'unknown' )
			),
		};
	} catch {
		// If HEAD request fails, try a regular GET request with a range
		// Some servers don't support HEAD requests
		try {
			const response = await fetch( url, {
				method: 'GET',
				headers: { Range: 'bytes=0-0' },
			} );

			if ( ! response.ok && response.status !== 206 ) {
				return {
					type: null,
					error: sprintf(
						/* translators: %d: HTTP status code */
						__( 'Unable to access the URL (HTTP %d).' ),
						response.status
					),
				};
			}

			const contentType = response.headers.get( 'Content-Type' ) || '';

			if ( contentType.startsWith( 'image/' ) ) {
				return { type: IMAGE_BACKGROUND_TYPE, error: null };
			}

			if ( contentType.startsWith( 'video/' ) ) {
				return { type: VIDEO_BACKGROUND_TYPE, error: null };
			}

			// Content-Type doesn't match image or video
			return {
				type: null,
				error: sprintf(
					/* translators: %s: Content-Type header value */
					__(
						'The URL does not point to a valid image or video file (Content-Type: %s).'
					),
					contentType || __( 'unknown' )
				),
			};
		} catch {
			// Both HEAD and GET requests failed - likely CORS or network error
			return {
				type: null,
				error: __(
					'Unable to verify the URL. This may be due to CORS restrictions or the resource is not accessible.'
				),
			};
		}
	}
}

/**
 * Detects the media type from a URL based on the file extension.
 * This is a fast path before making network requests.
 *
 * @param {string} url The URL to analyze.
 * @return {string|null} The media type ('image' or 'video'), or null if unknown.
 */
function getMediaTypeFromExtension( url ) {
	// Extract the pathname from the URL to get the file extension
	let pathname;
	try {
		pathname = new URL( url, window.location.origin ).pathname;
	} catch {
		pathname = url;
	}

	// Remove query string and hash from pathname
	pathname = pathname.split( '?' )[ 0 ].split( '#' )[ 0 ];

	// Common image extensions
	const imageExtensions = [
		'jpg',
		'jpeg',
		'png',
		'gif',
		'webp',
		'avif',
		'svg',
		'bmp',
		'ico',
	];
	// Common video extensions
	const videoExtensions = [
		'mp4',
		'webm',
		'ogg',
		'ogv',
		'mov',
		'avi',
		'wmv',
		'flv',
		'm4v',
	];

	const extension = pathname.split( '.' ).pop()?.toLowerCase();

	if ( extension && imageExtensions.includes( extension ) ) {
		return IMAGE_BACKGROUND_TYPE;
	}

	if ( extension && videoExtensions.includes( extension ) ) {
		return VIDEO_BACKGROUND_TYPE;
	}

	// Return null to indicate we couldn't determine from extension
	return null;
}
