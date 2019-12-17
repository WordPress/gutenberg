/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

/**
 * Returns the main key combination for a given shortcut Name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @return {Object} Key combination.
 */
export function getShortcutKeysCombination( state, name ) {
	return state[ name ] ? state[ name ].combination : null;
}

/**
 * Returns the aliases for a given shortcut Name.
 *
 * @param {Object} state Global state.
 * @param {string} name  Shortcut name.
 *
 * @return {Array} Key combination.
 */
export function getShortcutAliases( state, name ) {
	return state[ name ] && state[ name ].aliases ?
		state[ name ].aliases :
		EMPTY_ARRAY;
}
