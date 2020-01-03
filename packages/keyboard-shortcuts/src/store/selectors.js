/**
 * External dependencies
 */
import createSelector from 'rememo';
import { compact } from 'lodash';

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
 * {{[string]:Function}} Shortcut Formatting Methods.
 */
const FORMATTING_METHODS = {
	display: displayShortcut,
	raw: rawShortcut,
	ariaLabel: shortcutAriaLabel,
};

/**
 * Returns a string representing the key combination.
 *
 * @param {WPShortcutKeyCombination} shortcut  Key combination.
 * @param {string} representation              Type of reprensentation. (display, raw, ariaLabel )
 *
 * @return {string?} Shortcut representation.
 */
function getKeyCombinationRepresentation( shortcut, representation ) {
	if ( ! shortcut ) {
		return null;
	}

	return shortcut.modifier ?
		FORMATTING_METHODS[ representation ][ shortcut.modifier ]( shortcut.character ) :
		shortcut.character;
}

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
 * @return {string?} Shortcut representation.
 */
export function getShortcutRepresentation( state, name, representation = 'display' ) {
	const shortcut = getShortcutKeyCombination( state, name );
	return getKeyCombinationRepresentation( shortcut, representation );
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

/**
 * Returns the raw representation of all the keyboard combinations of a given shortcut name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @return {string[]} Shortcuts.
 */
export const getAllShortcutRawKeyCombinations = createSelector(
	( state, name ) => {
		return compact( [
			getKeyCombinationRepresentation(
				getShortcutKeyCombination( state, name ), 'raw'
			),
			...getShortcutAliases( state, name ).map(
				( combination ) => getKeyCombinationRepresentation( combination, 'raw' )
			),
		] );
	},
	( state, name ) => [ state[ name ] ]
);
