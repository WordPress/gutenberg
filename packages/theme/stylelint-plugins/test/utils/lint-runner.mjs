import stylelint from 'stylelint';

/*
 * Lints a single file and prints the result as JSON on stdout.
 *
 * This runs in its own Node process because stylelint is ESM-only and cannot be
 * loaded from Jest's CommonJS runtime. See `./index.ts`.
 *
 * The payload is a JSON-encoded `{ files, config, ignorePath }` object passed as
 * the first argument.
 */
const { files, config, ignorePath } = JSON.parse( process.argv[ 2 ] );

const { errored, report } = await stylelint.lint( {
	files,
	config,
	ignorePath,
	formatter: 'json',
} );

process.stdout.write(
	JSON.stringify( { errored, results: JSON.parse( report ) } )
);
