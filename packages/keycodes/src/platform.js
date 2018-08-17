/**
 * Return true if platform is MacOS.
 *
 * @param {Object} _window   window object by default; used for DI testing.
 *
 * @return {boolean}         True if MacOS; false otherwise.
 */
export function isAppleOS( _window = window ) {
	return _window.navigator.platform.indexOf( 'Mac' ) !== -1;
}
