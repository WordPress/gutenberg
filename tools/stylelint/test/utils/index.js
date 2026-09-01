import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import config from '../../config.js';

const testDirectory = fileURLToPath( new URL( '../', import.meta.url ) );

export const getStylelintResult = async ( filename ) => {
	const { errored, report } = await stylelint.lint( {
		files: path.resolve( testDirectory, filename ),
		config,
		ignorePath: path.resolve( testDirectory, './.stylelintignore' ),
		formatter: 'json',
	} );

	return {
		errored,
		results: JSON.parse( report ),
	};
};
