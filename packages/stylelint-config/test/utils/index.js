/**
 * External dependencies
 */
const util = require( 'node:util' ),
	path = require( 'node:path' ),
	childProcess = require( 'node:child_process' );

const execute = util.promisify( childProcess.exec );

const generateStylelintCommand = ( filename ) =>
	'npx stylelint ' +
	path.resolve( __dirname, '../', filename ) +
	' -c' +
	path.resolve( __dirname, '../', './.stylelintrc.tests.json' ) +
	' --formatter json' +
	' --ignore-path ' +
	path.resolve( __dirname, '../', './.stylelintignore' );

/**
 * Extract JSON from stderr, filtering out npm/pnpm warnings.
 * When running via Jest, npm/pnpm warnings may appear before the JSON output.
 *
 * @param {string} stderr - The stderr output
 * @return {Object} Parsed JSON results
 */
function parseStylelintOutput( stderr ) {
	// Find the JSON array in the output (starts with '[' and ends with ']')
	const jsonMatch = stderr.match( /\[[\s\S]*\]/ );
	if ( jsonMatch ) {
		return JSON.parse( jsonMatch[ 0 ] );
	}
	return JSON.parse( stderr );
}

module.exports = {
	getStylelintResult: ( filename ) =>
		execute( generateStylelintCommand( filename ) )
			.then( ( { stderr } ) => {
				return {
					errored: false,
					results: parseStylelintOutput( stderr ),
				};
			} )
			.catch( ( { stderr } ) => {
				return {
					errored: true,
					results: parseStylelintOutput( stderr ),
				};
			} ),
};
