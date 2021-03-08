interface Environment {
	NODE_ENV: unknown;
	COMPONENT_SYSTEM_PHASE: number | undefined;
	FORCE_REDUCED_MOTION: unknown;
}
interface Process {
	env: Environment;
}
declare var process: Process;
