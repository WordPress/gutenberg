/**
 * WordPress dependencies
 */
import { displayShortcut, shortcutAriaLabel, rawShortcut } from '@wordpress/keycodes';

/** @typedef {import('./actions').WPShortcutKeyCombination} WPShortcutKeyCombination */

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

/**
 * Returns the main key combination for a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @return {WPShortcutKeyCombination?} Key combination.
 */
export function getShortcutKeyCombination( state, name ) {
	return state[ name ] ? state[ name ].keyCombination : null;
}

/**
 * Returns a string representing the main key combination for a given shortcut name.
 *
 * @param {Object} state          Global state.
 * @param {string} name           Shortcut name.
 * @param {string} representation Type of reprensentation. (display, raw, ariaLabel )
 *
 * @return {string} Shortcut representation.
 */
export function getShortcutRepresentation( state, name, representation = 'display' ) {
	const shortcut = getShortcutKeyCombination( state, name );
	if ( ! shortcut ) {
		return null;
	}

	const formattingMethods = {
		display: displayShortcut,
		raw: rawShortcut,
		ariaLabel: shortcutAriaLabel,
	};

	return shortcut.modifier ?
		formattingMethods[ representation ][ shortcut.modifier ]( shortcut.character ) :
		shortcut.character;
}

/**
 * Returns the shortcut description given its name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @return {string?} Shortcut description.
 */
export function getShortcutDescription( state, name ) {
	return state[ name ] ? state[ name ].description : null;
}

/**
 * Returns the aliases for a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @return {WPShortcutKeyCombination[]} Key combinations.
 */
export function getShortcutAliases( state, name ) {
	return state[ name ] && state[ name ].aliases ?
		state[ name ].aliases :
		EMPTY_ARRAY;
}
