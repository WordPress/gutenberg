/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}   name     Command name.
 * @property {string}   label    Command label.
 * @property {Function} callback Command callback.
 */

/**
 * Returns an action object used to register a new command.
 *
 * @param {WPCommandConfig} config Command config.
 *
 * @return {Object} action.
 */
export function registerCommand( { name, label, callback } ) {
	return {
		type: 'REGISTER_COMMAND',
		name,
		label,
		callback,
	};
}

/**
 * Returns an action object used to unregister a command.
 *
 * @param {string} name Command name.
 *
 * @return {Object} action.
 */
export function unregisterCommand( name ) {
	return {
		type: 'UNREGISTER_COMMAND',
		name,
	};
}
