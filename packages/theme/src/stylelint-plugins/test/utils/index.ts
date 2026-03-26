import util from 'node:util';
import path from 'node:path';
import childProcess from 'node:child_process';

const execute = util.promisify( childProcess.exec );

const generateStylelintCommand = (
	filename: string,
	configFile: string
): string =>
	'npx stylelint ' +
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
