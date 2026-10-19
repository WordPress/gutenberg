declare namespace NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV?: 'production' | 'development' | 'test';
	}
	interface Process {
		env: NodeJS.ProcessEnv;
	}
}

declare var process: NodeJS.Process;

/**
 * Whether the code is running in WordPress with SCRIPT_DEBUG flag.
 */
declare var SCRIPT_DEBUG: undefined | boolean;

/**
 * Whether code is running within the Gutenberg plugin.
 *
 * When the codebase is built for the plugin, this variable will be set to `true`.
 * When building for WordPress Core, it will be set to `false` or `undefined`.
 */
declare var IS_GUTENBERG_PLUGIN: undefined | boolean;

declare var IS_WORDPRESS_CORE: undefined | boolean;
