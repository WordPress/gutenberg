import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import config from '../../config.js';

const testDirectory = fileURLToPath( new URL( '../', import.meta.url ) );

export const getStylelintResult = async ( filename ) => {
	const { errored, report } = await stylelint.lint( {
		files: path.resolve( testDirectory, filename ),
		config,
		/*
		 * The config is passed inline, so point `extends` and `plugins`
		 * resolution at the package that owns it rather than the current
		 * working directory, which only resolves under a hoisted install.
		 */
		configBasedir: path.resolve( testDirectory, '../' ),
		ignorePath: path.resolve( testDirectory, './.stylelintignore' ),
		formatter: 'json',
	} );

	return {
		errored,
		results: JSON.parse( report ),
	};
};
