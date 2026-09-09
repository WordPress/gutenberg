import { IMAGE_BACKGROUND_TYPE, VIDEO_BACKGROUND_TYPE } from '../shared';

const IMAGE_EXTENSIONS = [
	'avif',
	'bmp',
	'gif',
	'heic',
	'heif',
	'ico',
	'jpeg',
	'jpg',
	'png',
	'svg',
	'webp',
];

const VIDEO_EXTENSIONS = [
	'avi',
	'flv',
	'm4v',
	'mov',
	'mp4',
	'mpeg',
	'mpg',
	'ogv',
	'webm',
	'wmv',
];

/**
 * Reads the lowercased file extension of a URL, ignoring any query string and
 * fragment. Relative paths are supported, as the URL field accepts them.
 *
 * @param {string} url The URL to read.
 *
 * @return {string} The extension, or an empty string when the URL has none.
 */
function getExtension( url ) {
	let pathname;

	try {
		( { pathname } = new URL( url, window.location.href ) );
	} catch {
		// Not parseable as a URL, so strip the query and fragment by hand.
		pathname = url.split( /[?#]/ )[ 0 ];
	}

	const lastDot = pathname.lastIndexOf( '.' );
	const lastSlash = pathname.lastIndexOf( '/' );

	// The dot has to follow the last slash, and cannot be the character right
	// after it, which would make it a dotfile rather than an extension.
	return lastDot > lastSlash + 1
		? pathname.slice( lastDot + 1 ).toLowerCase()
		: '';
}

/**
 * Resolves whether the URL can be displayed by an image element.
 *
 * @param {string} url The URL to load.
 *
 * @return {Promise<boolean>} Whether the image loaded.
 */
function canLoadAsImage( url ) {
	return new Promise( ( resolve ) => {
		const image = new window.Image();
		image.onload = () => resolve( true );
		image.onerror = () => resolve( false );
		image.src = url;
	} );
}

/**
 * Determines whether a URL points at an image or a video, so that a background
 * added from a URL gets the right `backgroundType`.
 *
 * The file extension answers this for most URLs. When it doesn't, the URL is
 * loaded in an image element: that isn't subject to CORS — it is how the block
 * renders the background anyway — so it also works for media served without
 * CORS headers, and the browser caches the response for the render that
 * follows. Anything that doesn't load as an image is treated as a video, which
 * is the same assumption `attributesFromMedia` makes for media of an unknown
 * type.
 *
 * @param {string} url The URL of the media.
 *
 * @return {Promise<string>} Either `image` or `video`.
 */
export default async function getMediaTypeFromUrl( url ) {
	const extension = getExtension( url );

	if ( IMAGE_EXTENSIONS.includes( extension ) ) {
		return IMAGE_BACKGROUND_TYPE;
	}

	if ( VIDEO_EXTENSIONS.includes( extension ) ) {
		return VIDEO_BACKGROUND_TYPE;
	}

	return ( await canLoadAsImage( url ) )
		? IMAGE_BACKGROUND_TYPE
		: VIDEO_BACKGROUND_TYPE;
}
