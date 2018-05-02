export const ALT = 'alt';
export const CONTROL = 'mod';
export const META = 'meta';
export const SHIFT = 'shift';

export default function keyboardShortcut( ...keys ) {
	// Allow the first argument to be a mocked `window` object for testing.
	const windowIsMocked = typeof keys[ 0 ] !== 'string';
	const _window = windowIsMocked ? keys.shift() : window;

	const isMac = _window.navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;

	const control = isMac ? '⌘' : 'Ctrl';
	const alt = isMac ? '⌥' : 'Alt';
	const meta = isMac ? '⌃' : '⊞';
	const shift = isMac ? '⇧' : 'Shift';
	const replacementMap = {
		[ ALT ]: alt,
		[ CONTROL ]: control,
		[ META ]: meta,
		[ SHIFT ]: shift,
	};

	const joinCharacter = isMac ? '' : '+';

	return keys.map(
		( key ) => replacementMap.hasOwnProperty( key ) ? replacementMap[ key ] : key
	).join( joinCharacter );
}
