const util = require( 'node:util' ),
	path = require( 'node:path' ),
	childProcess = require( 'node:child_process' );

const execute = util.promisify( childProcess.exec );

const generateStylelintCommand = ( filename ) =>
	'npx stylelint ' +
	path.resolve( __dirname, '../', filename ) +
	' -c' +
	path.resolve( __dirname, '../', './.stylelintrc.json' ) +
	' --formatter json';

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
