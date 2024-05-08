declare namespace NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV?: 'production' | 'development' | 'test';
	}
	interface Process {
		env: NodeJS.ProcessEnv;
	}
}

declare var process: NodeJS.Process;

declare var SCRIPT_DEBUG: undefined | boolean;
declare var IS_GUTENBERG_PLUGIN: undefined | boolean;
declare var IS_WORDPRESS_CORE: undefined | boolean;
