import type { JSX } from 'react';

export type CommandCategory =
	'command' | 'view' | 'edit' | 'workflow' | 'action';

/**
 * Configuration of a registered command.
 */
export interface CommandConfig {
	/**
	 * Command name.
	 */
	name: string;
	/**
	 * Command label.
	 */
	label: string;
	/**
	 * Command search label.
	 */
	searchLabel?: string;
	/**
	 * Command context.
	 */
	context?: string;
	/**
	 * Command category.
	 */
	category?: CommandCategory;
	/**
	 * Command icon.
	 */
	icon?: JSX.Element;
	/**
	 * Command callback.
	 */
	callback: ( options: { close: () => void } ) => void;
	/**
	 * Whether to disable the command.
	 */
	disabled?: boolean;
	/**
	 * Command keywords for search matching.
	 */
	keywords?: string[];
}

export interface CommandLoaderHookResult {
	commands?: CommandConfig[];
	isLoading?: boolean;
}

export type CommandLoaderHook = ( options: {
	search: string;
} ) => CommandLoaderHookResult;

/**
 * Command loader config.
 */
export interface CommandLoaderConfig {
	/**
	 * Command loader name.
	 */
	name: string;
	/**
	 * Command loader context.
	 */
	context?: string;
	/**
	 * Command loader category.
	 */
	category?: CommandCategory;
	/**
	 * Command loader hook.
	 */
	hook: CommandLoaderHook;
	/**
	 * Whether to disable the command loader.
	 */
	disabled?: boolean;
}

export type Command = Omit< CommandConfig, 'disabled' >;

export type CommandLoader = Omit< CommandLoaderConfig, 'disabled' >;

export type Action =
	| ( Omit< CommandConfig, 'category' > & {
			type: 'REGISTER_COMMAND';
			category: CommandCategory;
	  } )
	| { type: 'UNREGISTER_COMMAND'; name: string }
	| ( Omit< CommandLoaderConfig, 'category' > & {
			type: 'REGISTER_COMMAND_LOADER';
			category: CommandCategory;
	  } )
	| { type: 'UNREGISTER_COMMAND_LOADER'; name: string }
	| { type: 'OPEN' }
	| { type: 'CLOSE' }
	| { type: 'SET_CONTEXT'; context: string }
	| {
			type: 'SET_LOADER_LOADING';
			name: string;
			isLoading: boolean | undefined;
	  };

export interface State {
	commands: Record< string, Command >;
	commandLoaders: Record< string, CommandLoader >;
	isOpen: boolean;
	context: string;
	loaderStates: Record< string, boolean | undefined >;
}
