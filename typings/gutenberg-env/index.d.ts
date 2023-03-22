interface Environment {
	NODE_ENV: unknown;
	IS_GUTENBERG_PLUGIN?: boolean;
	ALLOW_EXPERIMENT_REREGISTRATION?: boolean;
}
interface Process {
	env: Environment;
}
declare var process: Process;
