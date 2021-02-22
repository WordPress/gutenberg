/* eslint-disable no-undef, no-unused-vars, no-var */
interface Environment {
	NODE_ENV: unknown;
	COMPONENT_SYSTEM_PHASE: number | undefined;
}
interface Process {
	env: Environment;
}
declare var process: Process;
/* eslint-enable no-undef, no-unused-vars, no-var */
