/**
 * Keyboard key combination.
 *
 * @typedef {Object} WPShortcutKeyCombination
 *
 * @property {string}  character Character.
 * @property {string?} modifier  Modifier.
 */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPShortcutConfig
 *
 * @property {string} name           Shortcut name.
 * @property {string} category       Shortcut category.
 * @property {string} description    Shortcut description.
 * @property {Object} keyCombination Shortcut key combination.
 * @property {Array?} aliases        Shortcut aliases.
 */

/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {WPShortcutConfig} config Shortcut config.
 *
 * @return {Object} action.
 */
export function registerShortcut( { name, category, description, keyCombination, aliases } ) {
	return {
		type: 'REGISTER_SHORTCUT',
		name,
		category,
		keyCombination,
		aliases,
		description,
	};
}

/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {string} name Shortcut name.
 *
 * @return {Object} action.
 */
export function unregisterShortcut( name ) {
	return {
		type: 'UNREGISTER_SHORTCUT',
		name,
	};
}
