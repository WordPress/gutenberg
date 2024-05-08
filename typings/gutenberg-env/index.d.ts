interface Environment {
	NODE_ENV: unknown;
	IS_GUTENBERG_PLUGIN?: boolean;
	IS_WORDPRESS_CORE?: boolean;
}

declare namespace NodeJS {
	export interface ProcessEnv extends Environment {}

	export interface Process {
		env: ProcessEnv;
	}
}

declare var process: NodeJS.Process;

declare var SCRIPT_DEBUG: boolean;
