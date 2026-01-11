declare namespace NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV?: 'production' | 'development' | 'test' | string;
	}
	interface Process {
		env: NodeJS.ProcessEnv;
	}
}

declare const process: NodeJS.Process;

/**
 * Whether the code is running in WordPress with SCRIPT_DEBUG flag.
 */
declare const SCRIPT_DEBUG: boolean | undefined;

/**
 * Whether code is running within the Gutenberg plugin.
 *
 * When the codebase is built for the plugin, this variable will be set to `true`.
 * When building for WordPress Core, it will be set to `false` or `undefined`.
 */
declare const IS_GUTENBERG_PLUGIN: boolean | undefined;

declare const IS_WORDPRESS_CORE: boolean | undefined;

export {};
