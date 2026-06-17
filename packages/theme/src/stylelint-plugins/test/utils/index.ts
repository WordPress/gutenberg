import util from 'node:util';
import path from 'node:path';
import childProcess from 'node:child_process';

const execute = util.promisify( childProcess.exec );

/*
 * Resolve Stylelint's binary through Node's module resolution rather than a
 * fixed `node_modules/.bin` path, so the test works regardless of whether the
 * dependency is hoisted to the repo root or isolated in this package.
 */
const stylelintBin = path.join(
	path.dirname( require.resolve( 'stylelint/package.json' ) ),
	'bin/stylelint.mjs'
);

const generateStylelintCommand = (
	filename: string,
	configFile: string
): string =>
	'node ' +
	stylelintBin +
	' ' +
	path.resolve( __dirname, '../', filename ) +
	' -c ' +
	path.resolve( __dirname, '../', configFile ) +
	' --formatter json' +
	' --ignore-path ' +
	path.resolve( __dirname, '../', './.stylelintignore' );

export const getStylelintResult = ( filename: string, configFile: string ) =>
	execute( generateStylelintCommand( filename, configFile ) )
		.then( ( { stderr } ) => {
			return {
				errored: false,
				results: JSON.parse( stderr as string ),
			};
		} )
		.catch( ( { stderr } ) => {
			return {
				errored: true,
				results: JSON.parse( stderr ),
			};
		} );
