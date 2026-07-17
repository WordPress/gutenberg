/**
 * External dependencies
 */
const util = require( 'node:util' ),
	path = require( 'node:path' ),
	childProcess = require( 'node:child_process' );

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

const generateStylelintCommand = ( filename ) =>
	'node ' +
	stylelintBin +
	' ' +
	path.resolve( __dirname, '../', filename ) +
	' -c' +
	path.resolve( __dirname, '../', './.stylelintrc.tests.json' ) +
	' --formatter json' +
	' --ignore-path ' +
	path.resolve( __dirname, '../', './.stylelintignore' );

module.exports = {
	getStylelintResult: ( filename ) =>
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
			} ),
};
