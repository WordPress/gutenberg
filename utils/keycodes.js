/**
 * Browser dependencies
 */
const { userAgent } = window.navigator;

const isMac = userAgent.indexOf( 'Mac' ) !== -1;

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

/**
 * Converts a character to a key code.
 *
 * @param {string} character A single character.
 *
 * @returns {number}           The corresponding key code.
 */
function characterToKeyCode( character ) {
	return character.toUpperCase().charCodeAt( 0 );
}

/**
 * Check if the access keys and the given character are presssed.
 *
 * @param {KeyboardEvent} event     The event object.
 * @param {string}        character The character to check.
 *
 * @returns {boolean}                 True if the combination is pressed, false if not.
 */
export function isAccess( event, character ) {
	if ( ! event[ isMac ? 'ctrlKey' : 'shiftKey' ] || ! event.altKey ) {
		return false;
	}

	return ! character || ( event.keyCode === characterToKeyCode( character ) );
}

/**
 * Get an access key combination based on a character.
 *
 * @param {string} character The character for the access combination.
 *
 * @returns {string}           The access combination.
 */
export function getAccessCombination( character ) {
	const access = isMac ? 'Ctrl+Alt' : 'Shift+Alt';

	character = character.toUpperCase();

	return `${ access }+${ character }`;
}
