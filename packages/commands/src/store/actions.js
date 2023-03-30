/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}   name     Command name.
 * @property {string}   label    Command label.
 * @property {string=}  group    Command group.
 * @property {Function} callback Command callback.
 */

/**
 * @typedef {(search: string) => WPCommandConfig[]} WPCommandLoaderHook hoo
 */

/**
 * Command loader config.
 *
 * @typedef {Object} WPCommandLoaderConfig
 *
 * @property {string}              name  Command loader name.
 * @property {string=}             group Command loader group.
 * @property {WPCommandLoaderHook} hook  Command loader hook.
 */

/**
 * Returns an action object used to register a new command.
 *
 * @param {WPCommandConfig} config Command config.
 *
 * @return {Object} action.
 */
export function registerCommand( { name, label, callback, group = '' } ) {
	return {
		type: 'REGISTER_COMMAND',
		name,
		label,
		callback,
		group,
	};
}

/**
 * Returns an action object used to unregister a command.
 *
 * @param {string} name  Command name.
 * @param {string} group Command group.
 *
 * @return {Object} action.
 */
export function unregisterCommand( name, group ) {
	return {
		type: 'UNREGISTER_COMMAND',
		name,
		group,
	};
}

/**
 * Register command loader.
 *
 * @param {WPCommandLoaderConfig} config Command loader config.
 *
 * @return {Object} action.
 */
export function registerCommandLoader( { name, group = '', hook } ) {
	return {
		type: 'REGISTER_COMMAND_LOADER',
		name,
		group,
		hook,
	};
}

/**
 * Unregister command loader hook.
 *
 * @param {string} name  Command loader name.
 * @param {string} group Command loader group.
 *
 * @return {Object} action.
 */
export function unregisterCommandLoader( name, group ) {
	return {
		type: 'UNREGISTER_COMMAND_LOADER',
		name,
		group,
	};
}
