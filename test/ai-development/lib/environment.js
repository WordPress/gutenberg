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

export const minimalEnvironment = Object.fromEntries(
	Object.keys( process.env )
		.filter( ( name ) => ! KEPT.includes( name ) )
		.map( ( name ) => [ name, '' ] )
);
