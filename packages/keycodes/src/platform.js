/**
 * Return true if platform is MacOS.
 *
 * @param {Window?} _window window object by default; used for DI testing.
 *
 * @return {boolean} True if MacOS; false otherwise.
 */
export function isAppleOS( _window = null ) {
	if ( ! _window ) {
		if ( typeof window === 'undefined' ) {
			return false;
		}

		_window = window;
	}

	const { platform } = _window.navigator;

	return (
		platform.indexOf( 'Mac' ) !== -1 ||
		[ 'iPad', 'iPhone' ].includes( platform )
	);
}
