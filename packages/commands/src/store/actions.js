/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}   name     Command name.
 * @property {string}   label    Command label.
 * @property {string=}  page     Command page.
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
 * @property {string=}             page        Command loader page.
 * @property {string=}             placeholder Command page placeholder.
 * @property {WPCommandLoaderHook} hook        Command loader hook.
 */

/**
 * Returns an action object used to register a new command.
 *
 * @param {WPCommandConfig} config Command config.
 *
 * @return {Object} action.
 */
export function registerCommand( { name, label, callback, page = null } ) {
	return {
		type: 'REGISTER_COMMAND',
		name,
		label,
		callback,
		page,
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

/**
 * Register command loader.
 *
 * @param {WPCommandLoaderConfig} config Command loader config.
 *
 * @return {Object} action.
 */
export function registerCommandLoader( { page, hook, placeholder } ) {
	return {
		type: 'REGISTER_COMMAND_LOADER',
		page,
		hook,
		placeholder,
	};
}

/**
 * Unregister command loader hook.
 *
 * @param {string} page Command loader page.
 *
 * @return {Object} action.
 */
export function unregisterCommandLoader( page ) {
	return {
		type: 'UNREGISTER_COMMAND_LOADER',
		page,
	};
}
