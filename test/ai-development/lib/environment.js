/**
 * The environment an evaluated agent is allowed to keep.
 *
 * Promptfoo copies this process's whole environment into the agent with no way
 * to opt out, so an `ANTHROPIC_API_KEY` or `GITHUB_TOKEN` exported in the shell
 * that started the run is readable with `echo $VAR`, and reaches the model and
 * `results/` from there. The sandbox does not help: it bounds what the agent
 * can open, not what it was handed.
 *
 * A provider's `env` can only overwrite a name, never remove one, so
 * withholding a variable means blanking it. The names below are kept because a
 * shell needs them — blank `PATH` and nothing runs.
 *
 * The list is snapshotted on first import, so `specs/sandbox` sets its probe
 * variable in a module imported ahead of the configuration.
 */
export const KEPT = [
	'HOME',
	'LANG',
	'LC_ALL',
	'PATH',
	'SHELL',
	'TERM',
	'TMPDIR',
	'USER',
];

const minimalEnvironment = Object.fromEntries(
	Object.keys( process.env )
		.filter( ( name ) => ! KEPT.includes( name ) )
		.map( ( name ) => [ name, '' ] )
);

/**
 * The environment the evaluated agent runs with.
 */
export const agentEnvironment = {
	...minimalEnvironment,

	// Force docker to fail fast if the agent tries to start an environment
	DOCKER_HOST: 'unix:///nonexistent/docker.sock',

	// Git reads its global config on every invocation, and that config lives
	// in the home directory, which the sandbox denies. Git itself runs fine;
	// `~/.gitconfig` is what it cannot read, so every `git` command fails with
	// `Operation not permitted`.
	GIT_CONFIG_GLOBAL: '/dev/null',
};
