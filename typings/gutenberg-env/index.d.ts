interface Environment {
	NODE_ENV: unknown;
	IS_GUTENBERG_PLUGIN?: boolean;
	IS_WORDPRESS_CORE?: boolean;
	ALLOW_EXPERIMENT_REREGISTRATION?: boolean;
}
interface Process {
	env: Environment;
}
declare var process: Process;
