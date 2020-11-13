/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	displayShortcut,
	shortcutAriaLabel,
	rawShortcut,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { shortcutsAtom, shortcutsByNameFamily } from './atoms';

/** @typedef {import('./actions').WPShortcutKeyCombination} WPShortcutKeyCombination */

/** @typedef {import('@wordpress/keycodes').WPKeycodeHandlerByModifier} WPKeycodeHandlerByModifier */

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array<any>}
 */
const EMPTY_ARRAY = [];

/**
 * Shortcut formatting methods.
 *
 * @property {WPKeycodeHandlerByModifier} display     Display formatting.
 * @property {WPKeycodeHandlerByModifier} rawShortcut Raw shortcut formatting.
 * @property {WPKeycodeHandlerByModifier} ariaLabel   ARIA label formatting.
 */
const FORMATTING_METHODS = {
	display: displayShortcut,
	raw: rawShortcut,
	ariaLabel: shortcutAriaLabel,
};

/**
 * Returns a string representing the key combination.
 *
 * @param {?WPShortcutKeyCombination} shortcut       Key combination.
 * @param {keyof FORMATTING_METHODS}  representation Type of representation
 *                                                   (display, raw, ariaLabel).
 *
 * @return {string?} Shortcut representation.
 */
function getKeyCombinationRepresentation( shortcut, representation ) {
	if ( ! shortcut ) {
		return null;
	}

	return shortcut.modifier
		? FORMATTING_METHODS[ representation ][ shortcut.modifier ](
				shortcut.character
		  )
		: shortcut.character;
}

/**
 * Returns the shortcut object for a given shortcut name.
 *
 * @param {Function} get  get atom value.
 * @param {string}   name Shortcut name.
 * @return {WPShortcutKeyCombination?} Key combination.
 */
const getShortcut = ( get ) => ( name ) => {
	return get( shortcutsByNameFamily( name ) );
};

/**
 * Returns the main key combination for a given shortcut name.
 *
 * @param {Function} get  get atom value.
 * @param {string}   name Shortcut name.
 * @return {WPShortcutKeyCombination?} Key combination.
 */
export const getShortcutKeyCombination = ( get ) => ( name ) => {
	const shortcut = getShortcut( get )( name );
	return shortcut ? shortcut.keyCombination : null;
};

/**
 * Returns a string representing the main key combination for a given shortcut name.
 *
 * @param {Function}                 get            get atom value.
 * @param {string}                   name           Shortcut name.
 * @param {keyof FORMATTING_METHODS} representation Type of representation
 *                                                  (display, raw, ariaLabel).
 *
 * @return {string?} Shortcut representation.
 */
export const getShortcutRepresentation = ( get ) => (
	name,
	representation = 'display'
) => {
	const shortcut = getShortcutKeyCombination( get )( name );
	return getKeyCombinationRepresentation( shortcut, representation );
};

/**
 * Returns the shortcut description given its name.
 *
 * @param {Function} get  get atom value.
 * @param {string}   name Shortcut name.
 *
 * @return {string?} Shortcut description.
 */
export const getShortcutDescription = ( get ) => ( name ) => {
	const shortcut = getShortcut( get )( name );
	return shortcut ? shortcut.description : null;
};

/**
 * Returns the aliases for a given shortcut name.
 *
 * @param {Function} get  get atom value.
 * @param {string}   name Shortcut name.
 *
 * @return {WPShortcutKeyCombination[]} Key combinations.
 */
export const getShortcutAliases = ( get ) => ( name ) => {
	const shortcut = getShortcut( get )( name );
	return shortcut && shortcut.aliases ? shortcut.aliases : EMPTY_ARRAY;
};

/**
 * Returns the raw representation of all the keyboard combinations of a given shortcut name.
 *
 * @param {Function} get  get atom value.
 * @param {string}   name Shortcut name.
 *
 * @return {string[]} Shortcuts.
 */
export const getAllShortcutRawKeyCombinations = ( get ) => ( name ) => {
	return compact( [
		getKeyCombinationRepresentation(
			getShortcutKeyCombination( get )( name ),
			'raw'
		),
		...getShortcutAliases( get )( name ).map( ( combination ) =>
			getKeyCombinationRepresentation( combination, 'raw' )
		),
	] );
};

/**
 * Returns the shortcut names list for a given category name.
 *
 * @param {Function} get          get atom value.
 * @param {string}   categoryName Category name.
 *
 * @return {string[]} Shortcut names.
 */
export const getCategoryShortcuts = ( get ) => ( categoryName ) => {
	return ( get( shortcutsAtom ) || [] )
		.filter( ( shortcut ) => shortcut.category === categoryName )
		.map( ( { name } ) => name );
};
