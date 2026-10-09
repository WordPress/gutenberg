import type {
	CommandCategory,
	CommandConfig,
	CommandLoaderConfig,
} from './types';

/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * @typedef {'command'|'view'|'edit'|'workflow'|'action'} WPCommandCategory
 */

/**
 * Command categories allowed via registerCommand.
 * The 'workflow' category is reserved for internal use
 * and cannot be registered through this API.
 *
 * @type {Set<WPCommandCategory>}
 */
const REGISTERABLE_CATEGORIES = new Set< CommandCategory >( [
	'command',
	'view',
	'edit',
	'action',
] );

/**
 * Configuration of a registered command.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}             name        Command name.
 * @property {string}             label       Command label.
 * @property {string=}            searchLabel Command search label.
 * @property {string=}            context     Command context.
 * @property {WPCommandCategory=} category    Command category.
 * @property {React.JSX.Element=} icon        Command icon.
 * @property {Function}           callback    Command callback.
 * @property {boolean=}           disabled    Whether to disable the command.
 * @property {string[]=}          keywords    Command keywords for search matching.
 */

/**
 * @typedef {(options: {search: string}) => {commands?: WPCommandConfig[], isLoading?: boolean}|undefined} WPCommandLoaderHook
 */

/**
 * Command loader config.
 *
 * @typedef {Object} WPCommandLoaderConfig
 *
 * @property {string}              name     Command loader name.
 * @property {string=}             context  Command loader context.
 * @property {WPCommandCategory=}  category Command loader category.
 * @property {WPCommandLoaderHook} hook     Command loader hook.
 * @property {boolean=}            disabled Whether to disable the command loader.
 */

/**
 * Returns an action object used to register a new command.
 *
 * @param config Command config.
 *
 * @return action.
 */
export function registerCommand( config: CommandConfig ) {
	let { category } = config;

	// Defaults to 'action' if no category is provided or if the category is invalid. Future versions will emit a warning.
	if ( ! category || ! REGISTERABLE_CATEGORIES.has( category ) ) {
		category = 'action';
	}

	return {
		type: 'REGISTER_COMMAND' as const,
		...config,
		category,
	};
}

/**
 * Returns an action object used to unregister a command.
 *
 * @param name Command name.
 *
 * @return action.
 */
export function unregisterCommand( name: string ) {
	return {
		type: 'UNREGISTER_COMMAND' as const,
		name,
	};
}

/**
 * Register command loader.
 *
 * @param config Command loader config.
 *
 * @return action.
 */
export function registerCommandLoader( config: CommandLoaderConfig ) {
	let { category } = config;

	// Defaults to 'action' if no category is provided or if the category is invalid. Future versions will emit a warning.
	if ( ! category || ! REGISTERABLE_CATEGORIES.has( category ) ) {
		category = 'action';
	}

	return {
		type: 'REGISTER_COMMAND_LOADER' as const,
		...config,
		category,
	};
}

/**
 * Unregister command loader hook.
 *
 * @param name Command loader name.
 *
 * @return action.
 */
export function unregisterCommandLoader( name: string ) {
	return {
		type: 'UNREGISTER_COMMAND_LOADER' as const,
		name,
	};
}

/**
 * Opens the command palette.
 *
 * @return action.
 */
export function open() {
	return {
		type: 'OPEN' as const,
	};
}

/**
 * Closes the command palette.
 *
 * @return action.
 */
export function close() {
	return {
		type: 'CLOSE' as const,
	};
}
