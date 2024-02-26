interface Environment {
	NODE_ENV: unknown;
	IS_GUTENBERG_PLUGIN?: boolean;
	IS_WORDPRESS_CORE?: boolean;
}
interface Process {
	env: Environment;
}
declare var process: Process;

declare var SCRIPT_DEBUG: boolean;
