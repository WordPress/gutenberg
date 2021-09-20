interface Environment {
	NODE_ENV: unknown;
}
interface Process {
	env: Environment;
}
declare var process: Process;
