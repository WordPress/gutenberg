const videos = document.querySelectorAll( 'video' );
// `navigator` is a global object in browsers.
// eslint-disable-next-line no-undef
const userAgent = navigator.userAgent || '';
const appleDeviceRegex = /iP\w+/;

if ( appleDeviceRegex.test( userAgent ) ) {
	videos.forEach( function ( video ) {
		video.addEventListener(
			'loadedmetadata',
			function () {
				video.load();
			},
			{ once: true }
		);
	} );
}
