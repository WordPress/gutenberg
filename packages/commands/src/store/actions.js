/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}      name     Command name.
 * @property {string}      label    Command label.
 * @property {string=}     group    Command group.
 * @property {string=}     context  Command context.
 * @property {JSX.Element} icon     Command icon.
 * @property {Function}    callback Command callback.
 */

/**
 * @typedef {(search: string) => WPCommandConfig[]} WPCommandLoaderHook hoo
 */

/**
 * Command loader config.
 *
 * @typedef {Object} WPCommandLoaderConfig
 *
 * @property {string}              name    Command loader name.
 * @property {string=}             group   Command loader group.
 * @property {string=}             context Command loader context.
 * @property {WPCommandLoaderHook} hook    Command loader hook.
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
		group: config.group ?? '',
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
export function registerCommandLoader( config ) {
	return {
		type: 'REGISTER_COMMAND_LOADER',
		...config,
		group: config.group ?? '',
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

/**
 * Opens the command center.
 *
 * @return {Object} action.
 */
export function open() {
	return {
		type: 'OPEN',
	};
}

/**
 * Closes the command center.
 *
 * @return {Object} action.
 */
export function close() {
	return {
		type: 'CLOSE',
	};
}

/**
 * Sets the active context.
 *
 * @param {string} context Context.
 *
 * @return {Object} action.
 */
export function setContext( context ) {
	return {
		type: 'SET_CONTEXT',
		context,
	};
}
