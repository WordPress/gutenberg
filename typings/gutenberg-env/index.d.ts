interface Environment {
	NODE_ENV: unknown;
	FORCE_REDUCED_MOTION: boolean | undefined;
}
interface Process {
	env: Environment;
}
declare var process: Process;
