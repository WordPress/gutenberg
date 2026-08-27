/**
 * Promptfoo hands an agent a copy of this process's environment, so anything
 * exported in the shell that started the run — API keys, tokens — is readable
 * from Bash and can reach a model request or saved results.
 *
 * A provider's `env` can only override names, never start from nothing, so a
 * minimal environment is built by blanking everything outside this list.
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

	// Docker reaches its daemon over a unix socket, which the sandbox does not
	// cover; a socket that does not exist makes `docker` and `wp-env` fail
	// rather than start containers the sandbox cannot reach to clean up.
	DOCKER_HOST: 'unix:///nonexistent/docker.sock',

	// Git reads the global config on every invocation, and it lives in the home
	// directory, which the sandbox denies. Without this every `git` command in
	// the workspace fails with `Operation not permitted`, and the agent is
	// expected to inspect history. Pointing it at an empty file also keeps the
	// developer's identity and aliases out of the workspace.
	GIT_CONFIG_GLOBAL: '/dev/null',
};
