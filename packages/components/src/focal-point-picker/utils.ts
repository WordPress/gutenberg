export const INITIAL_BOUNDS = {
	width: 200,
	height: 170,
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
 * @param filename The file name.
 * @return  The extension of the file name.
 */
export function getExtension( filename = '' ): string {
	const parts = filename.split( '.' );
	return parts[ parts.length - 1 ];
}

/**
 * Checks if a file is a video.
 *
 * @param filename The file name.
 * @return Whether the file is a video.
 */
export function isVideoType( filename: string = '' ): boolean {
	if ( ! filename ) {
		return false;
	}
	return (
		filename.startsWith( 'data:video/' ) ||
		VIDEO_EXTENSIONS.includes( getExtension( filename ) )
	);
}

/**
 * Transforms a fraction value to a percentage value.
 *
 * @param fraction The fraction value.
 * @return A percentage value.
 */
export function fractionToPercentage( fraction: number ): number {
	return Math.round( fraction * 100 );
}
