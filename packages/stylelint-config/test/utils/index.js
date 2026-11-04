import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execute = promisify( exec );

/*
 * Resolve Stylelint's binary through Node's module resolution rather than a
 * fixed `node_modules/.bin` path, so the test works regardless of whether the
 * dependency is hoisted to the repo root or isolated in this package.
 */
const stylelintBin = fileURLToPath(
	new URL(
		'./bin/stylelint.mjs',
		import.meta.resolve( 'stylelint/package.json' )
	)
);
const testDirectory = fileURLToPath( new URL( '../', import.meta.url ) );

const generateStylelintCommand = ( filename ) =>
	'node ' +
	stylelintBin +
	' ' +
	path.resolve( testDirectory, filename ) +
	' -c' +
	path.resolve( testDirectory, './.stylelintrc.tests.json' ) +
	' --formatter json' +
	' --ignore-path ' +
	path.resolve( testDirectory, './.stylelintignore' );

export const getStylelintResult = ( filename ) =>
	execute( generateStylelintCommand( filename ) )
		.then( ( { stderr } ) => {
			return {
				errored: false,
				results: JSON.parse( stderr ),
			};
		} )
		.catch( ( { stderr } ) => {
			return {
				errored: true,
				results: JSON.parse( stderr ),
			};
		} );
