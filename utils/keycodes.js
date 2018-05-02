/**
 * Note: The order of the modifier keys in many of the [foo]Shortcut()
 * functions in this file are intentional and should not be changed. They're
 * designed to fit with the standard menu keyboard shortcuts shown in the
 * user's platform.
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
 * Instead, use primaryShortcut(), altShortcut(), etc.
 *
 * @param {string} keys      Modifier and keyboard keys, seperated by "+".
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function keyboardShortcut( keys, _isMacOS = isMacOS ) {
	const isMac = _isMacOS();

	const alt = isMac ? '⌥' : 'Alt';
	const meta = isMac ? '⌃' : '⊞';
	const primary = isMac ? '⌘' : 'Ctrl';
	const shift = isMac ? '⇧' : 'Shift';

	const replacementKeyMap = {
		[ ALT ]: alt,
		[ PRIMARY ]: primary,
		[ META ]: meta,
		[ SHIFT ]: shift,
	};

	const joinCharacter = isMac ? '' : '+';

	return keys
		.replace( /\s/g, '' )
		.split( '+' )
		.map( ( key ) => {
			return replacementKeyMap.hasOwnProperty( key ) ?
				replacementKeyMap[ key ] : key;
		} )
		.join( joinCharacter );
}

/**
 * Create an access key combonation shortcut based on a single character.
 *
 * Access key combo is: Command+Alt on MacOS; Shift+Alt everywhere else.
 * This will output Shift+Alt+G on Windows when "G" is supplied as an argument.
 *
 * @param {string} character The character for the access combination.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function accessShortcut( character, _isMacOS = isMacOS ) {
	const keyCombo = _isMacOS() ? `${ META }+${ ALT }` : `${ SHIFT }+${ ALT }`;
	return keyboardShortcut( `${ keyCombo }+${ character }`, _isMacOS );
}

/**
 * Create a Meta shortcut based on a single character.
 *
 * This will output Windows+G on Windows when "G" is supplied as an argument.
 * This will output Control+G on MacOS when "G" is supplied as an argument.
 *
 * @param {string} character The character for the key command.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function metaShortcut( character, _isMacOS = isMacOS ) {
	return keyboardShortcut( `${ META }+${ character }`, _isMacOS );
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
	return keyboardShortcut( `${ PRIMARY }+${ character }`, _isMacOS );
}

/**
 * Create a modifier+access shortcut based on a single character.
 *
 * This will output Ctrl+Shift+Alt+G on Windows when "G" is supplied as an argument.
 * This will output Option+Shift+Command+G on MacOS when "G" is supplied as an argument.
 *
 * @param {string} character The character for the key command.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function primaryAccessShortcut( character, _isMacOS = isMacOS ) {
	const keyCombo = _isMacOS() ?
		`${ ALT }+${ SHIFT }+${ PRIMARY }` : `${ PRIMARY }+${ SHIFT }+${ ALT }`;
	return keyboardShortcut( `${ keyCombo }+${ character }`, _isMacOS );
}

/**
 * Create a modifier+alt shortcut based on a single character.
 *
 * This will output Ctrl+Alt+G on Windows when "G" is supplied as an argument.
 * This will output Alt+Command+G on MacOS when "G" is supplied as an argument.
 *
 * @param {string} character The character for the key command.
 * @param {Object} _isMacOS  isMacOS function by default; used for DI testing.
 *
 * @return {string}          The keyboard shortcut.
 */
export function primaryAltShortcut( character, _isMacOS = isMacOS ) {
	const keyCombo = _isMacOS() ?
		`${ ALT }+${ PRIMARY }` : `${ PRIMARY }+${ ALT }`;
	return keyboardShortcut( `${ keyCombo }+${ character }`, _isMacOS );
}
