const VIDEO_EXTENSIONS = [ 'm4v', 'avi', 'mpg', 'mp4', 'webm', 'ogg' ];

export function getExtension( filename = '' ) {
	const parts = filename.split( '.' );
	return parts[ parts.length - 1 ];
}

export function isVideoType( filename = '' ) {
	if ( ! filename ) return false;
	return VIDEO_EXTENSIONS.includes( getExtension( filename ) );
}

export function fractionToPercentage( fraction ) {
	return Math.round( fraction * 100 );
}
