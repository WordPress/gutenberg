type WPCommandCategory = 'command' | 'view' | 'edit' | 'workflow' | 'action';

/**
 * Command categories allowed via registerCommand.
 * The 'workflow' category is reserved for internal use
 * and cannot be registered through this API.
 *
 * @type {Set<WPCommandCategory>}
 */
const REGISTERABLE_CATEGORIES = new Set< WPCommandCategory >( [
	'command',
	'view',
	'edit',
	'action',
] );

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPCommandConfig
 *
 * @property {string}             name        Command name.
 * @property {string}             label       Command label.
 * @property {string=}            searchLabel Command search label.
 * @property {string=}            context     Command context.
 * @property {WPCommandCategory=} category    Command category.
 * @property {React.JSX.Element}  icon        Command icon.
 * @property {Function}           callback    Command callback.
 * @property {boolean}            disabled    Whether to disable the command.
 * @property {string[]=}          keywords    Command keywords for search matching.
 */

export interface WPCommandConfig {
	/**
	 * Command name
	 *
	 * @type {string}
	 */
	name: string;
	label: string;
	searchLabel?: string;
	context?: string;
	category: WPCommandCategory;
	icon: JSX.Element;
	callback: ( props: { close: () => void } ) => void;
	disabled?: boolean;
	keywords?: string[];
}

type WPCommandLoaderHook = ( search: string ) => WPCommandConfig[];

/**
 * Command loader config.
 *
 * @typedef {Object} WPCommandLoaderConfig
 *
 * @property {string}              name     Command loader name.
 * @property {string=}             context  Command loader context.
 * @property {WPCommandCategory=}  category Command loader category.
 * @property {WPCommandLoaderHook} hook     Command loader hook.
 * @property {boolean}             disabled Whether to disable the command loader.
 */

export interface WPCommandLoaderConfig {
	name: string;
	context?: string;
	category?: WPCommandCategory;
	hook: WPCommandLoaderHook;
	disabled?: boolean;
}

/**
 * Returns an action object used to register a new command.
 *
 * @param {WPCommandConfig} config Command config.
 *
 * @return {Object} action.
 */
export function registerCommand( config: WPCommandConfig ) {
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
 * @param {string} name Command name.
 *
 * @return {Object} action.
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
 * @param {WPCommandLoaderConfig} config Command loader config.
 *
 * @return {Object} action.
 */
export function registerCommandLoader( config: WPCommandLoaderConfig ) {
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
 * @param {string} name Command loader name.
 *
 * @return {Object} action.
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
 * @return {Object} action.
 */
export function open() {
	return {
		type: 'OPEN' as const,
	};
}

/**
 * Closes the command palette.
 *
 * @return {Object} action.
 */
export function close() {
	return {
		type: 'CLOSE' as const,
	};
}

export type Action =
	| ReturnType< typeof registerCommand >
	| ReturnType< typeof unregisterCommand >
	| ReturnType< typeof registerCommandLoader >
	| ReturnType< typeof unregisterCommandLoader >
	| ReturnType< typeof open >
	| ReturnType< typeof close >;
