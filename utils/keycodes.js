/**
 * Note: The order of the modifier keys in many of the [foo]Shortcut()
 * functions in this file are intentional and should not be changed. They're
 * designed to fit with the standard menu keyboard shortcuts shown in the
 * user's platform.
 *
 * For example, on MacOS menu shortcuts will place Shift before Command, but
 * on Windows Control will usually come first. So don't provide your own
 * shortcut combos directly to keyboardShortcut().
 */
export const BACKSPACE = 8;
export const TAB = 9;
export const ENTER = 13;
export const ESCAPE = 27;
export const SPACE = 32;
export const LEFT = 37;
export const UP = 38;
export const RIGHT = 39;
export const DOWN = 40;
export const DELETE = 46;

export const F10 = 121;

export const ALT = 'alt';
export const CTRL = 'ctrl';
export const PRIMARY = 'mod';
export const META = 'meta';
export const SHIFT = 'shift';

/**
 * Return true if platform is MacOS.
 *
 * @param {Object} _window   window object by default; used for DI testing.
 *
 * @return {boolean}         True if MacOS; false otherwise.
 */
export function isMacOS( _window = window ) {
	return _window.navigator.platform.indexOf( 'Mac' ) !== -1;
}

/**
 * Create a keyboard shortcut based on a string of modifiers + key(s).
 *
 * This function is not intended to be used directly by developers.
 * Instead, use primaryShortcut(), accessShortcut(), etc.
 *
 * @param {string} keys          Modifier and keyboard keys, seperated by "+".
 * @param {Object} _isMacOS      isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function keyboardShortcut( keys, _isMacOS = isMacOS ) {
	const isMac = _isMacOS();

	const alt = isMac ? '⌥option' : 'Alt';
	const meta = isMac ? '⌃control' : '⊞';
	const primary = isMac ? '⌘' : 'Ctrl';
	const shift = isMac ? '⇧shift' : 'Shift';

	const replacementKeyMap = {
		[ ALT ]: alt,
		[ META ]: meta,
		[ PRIMARY ]: primary,
		[ SHIFT ]: shift,
	};

	return keys
		.replace( /\s/g, '' )
		.split( '+' )
		.map( ( key ) => {
			return replacementKeyMap.hasOwnProperty( key ) ?
				replacementKeyMap[ key ] : key;
		} )
		.join( '+' )
		// Because we use just the clover symbol for MacOS's "command" key, remove
		// the key join character ("+") between it and the final character if that
		// final character is alphanumeric. ⌘S looks nicer than ⌘+S.
		.replace( /⌘\+([a-zA-Z0-9])$/g, '⌘$1' );
}

/**
 * Create an access key shortcut based on a single character.
 *
 * Access key combo is:
 *  - Control+Alt on MacOS.
 *  - Shift+Alt on Windows/everywhere else.
 *
 * @param {string} character The character for the access combination.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function accessShortcut( character, _isMacOS = isMacOS ) {
	return keyboardShortcut( accessKeyCode( character.toUpperCase(), _isMacOS ), _isMacOS );
}

export function accessKeyCode( character, _isMacOS = isMacOS ) {
	const keyCombo = _isMacOS() ? `${ META }+${ ALT }` : `${ SHIFT }+${ ALT }`;
	return `${ keyCombo }+${ character }`;
}

/**
 * Create a modifier shortcut based on a single character.
 *
 * This will output Ctrl+G on Windows when "G" is supplied as an argument.
 * This will output Command+G on MacOS when "G" is supplied as an argument.
 *
 * @param {string} character The character for the key command.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function primaryShortcut( character, _isMacOS = isMacOS ) {
	return keyboardShortcut( `${ PRIMARY }+${ character.toUpperCase() }`, _isMacOS );
}

/**
 * Create an access key + primary key shortcut based on a single character.
 *
 * Access key combo is:
 *  - Control+Alt+Command on MacOS.
 *  - Control+Shift+Alt on Windows/everywhere else.
 *
 * @param {string} character The character for the access combination.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function secondaryShortcut( character, _isMacOS = isMacOS ) {
	return keyboardShortcut( secondaryKeyCode( character.toUpperCase(), _isMacOS ), _isMacOS );
}

export function secondaryKeyCode( character, _isMacOS = isMacOS ) {
	const keyCombo = _isMacOS() ? `${ SHIFT }+${ ALT }+${ PRIMARY }` : `${ PRIMARY }+${ SHIFT }+${ ALT }`;
	return `${ keyCombo }+${ character }`;
}
