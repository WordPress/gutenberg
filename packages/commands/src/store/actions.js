/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}      name        Command name.
 * @property {string}      label       Command label.
 * @property {string=}     searchLabel Command search label.
 * @property {string=}     context     Command context.
 * @property {JSX.Element} icon        Command icon.
 * @property {Function}    callback    Command callback.
 * @property {boolean}     disabled    Whether to disable the command.
 */

/**
 * @typedef {(search: string) => WPCommandConfig[]} WPCommandLoaderHook hoo
 */

/**
 * Command loader config.
 *
 * @typedef {Object} WPCommandLoaderConfig
 *
 * @property {string}              name     Command loader name.
 * @property {string=}             context  Command loader context.
 * @property {WPCommandLoaderHook} hook     Command loader hook.
 * @property {boolean}             disabled Whether to disable the command loader.
 */

/**
 * Returns an action object used to register a new command.
 *
 * @param {WPCommandConfig} config Command config.
 *
 * @return {Object} action.
 */
export function registerCommand( config ) {
	return {
		type: 'REGISTER_COMMAND',
		...config,
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
export function registerCommandLoader( config ) {
	return {
		type: 'REGISTER_COMMAND_LOADER',
		...config,
	};
}

/**
 * Unregister command loader hook.
 *
 * @param {string} name Command loader name.
 *
 * @return {Object} action.
 */
export function unregisterCommandLoader( name ) {
	return {
		type: 'UNREGISTER_COMMAND_LOADER',
		name,
	};
}

/**
 * Opens the command palette.
 *
 * @return {Object} action.
 */
export function open() {
	return {
		type: 'OPEN',
	};
}

/**
 * Closes the command palette.
 *
 * @return {Object} action.
 */
export function close() {
	return {
		type: 'CLOSE',
	};
}
