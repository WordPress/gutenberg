import path from 'node:path';
import stylelint from 'stylelint';

/**
 * Lints a fixture file with the stylelint Node API.
 *
 * The plugin is passed inline (rather than as a config-file path) so stylelint
 * loads it directly instead of `import()`-ing it, which keeps the tests working
 * under Jest without `--experimental-vm-modules`. The local `.stylelintignore`
 * overrides the repo-root ignore that would otherwise skip the fixtures.
 *
 * The JSON formatter output is parsed so the returned shape matches what the
 * previous CLI-based helper produced. `quietDeprecationWarnings` silences
 * stylelint's "CommonJS Node.js API is deprecated" notice, which it emits
 * because Jest loads the CommonJS build.
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
			quietDeprecationWarnings: true,
		} )
		.then( ( { errored, report } ) => ( {
			errored,
			results: JSON.parse( report ),
		} ) );
