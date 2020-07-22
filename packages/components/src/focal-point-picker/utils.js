export const INITIAL_BOUNDS = {
	top: 0,
	left: 0,
	bottom: 0,
	right: 0,
	width: 0,
	height: 0,
};

const VIDEO_EXTENSIONS = [
	'avi',
	'mpg',
	'mpeg',
	'mov',
	'mp4',
	'm4v',
	'ogg',
	'ogv',
	'webm',
	'wmv',
];

/**
 * Gets the extension of a file name.
 *
 * @param {string} filename The file name.
 * @return {string} The extension of the file name.
 */
export function getExtension( filename = '' ) {
	const parts = filename.split( '.' );
	return parts[ parts.length - 1 ];
}

/**
 * Checks if a file is a video.
 *
 * @param {string} filename The file name.
 * @return {boolean} Whether the file is a video.
 */
export function isVideoType( filename = '' ) {
	if ( ! filename ) return false;
	return VIDEO_EXTENSIONS.includes( getExtension( filename ) );
}

/**
 * Transforms a fraction value to a percentage value.
 *
 * @param {number} fraction The fraction value.
 * @return {number} A percentage value.
 */
export function fractionToPercentage( fraction ) {
	return Math.round( fraction * 100 );
}
