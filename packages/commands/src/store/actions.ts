import type {
	CommandCategory,
	CommandConfig,
	CommandLoaderConfig,
} from './types';

/**
 * Command categories allowed via registerCommand.
 * The 'workflow' category is reserved for internal use
 * and cannot be registered through this API.
 */
const REGISTERABLE_CATEGORIES = new Set< CommandCategory >( [
	'command',
	'view',
	'edit',
	'action',
] );

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
