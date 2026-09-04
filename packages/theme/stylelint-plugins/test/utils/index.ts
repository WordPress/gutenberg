import path from 'node:path';
import stylelint from 'stylelint';

/**
 * Lints a fixture file with the stylelint Node API.
 *
 * The local `.stylelintignore` overrides the repo-root ignore that would
 * otherwise skip the fixtures. The JSON formatter output is parsed so the
 * returned shape matches what the previous CLI-based helper produced.
 *
 * @param filename Fixture path relative to the `test` directory.
 * @param config   Inline stylelint config (plugin + rule under test).
 */
export const getStylelintResult = (
	filename: string,
	config: stylelint.Config
) =>
	stylelint
		.lint( {
			files: path.resolve( __dirname, '../', filename ),
			config,
			ignorePath: path.resolve( __dirname, '../', './.stylelintignore' ),
			formatter: 'json',
		} )
		.then( ( { errored, report } ) => ( {
			errored,
			results: JSON.parse( report ),
		} ) );
