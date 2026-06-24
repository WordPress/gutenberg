/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
// const stylelint = require( 'stylelint' );

// Stylelint's exit code for config-not-found errors
const CONFIG_NOT_FOUND_CODE = 78;

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	getArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	hasProjectFile,
} = require( '../utils' );

/**
 * Checks whether a resolvable Stylelint configuration exists
 * for the current working directory.
 *
 * @return {Promise<boolean>} Whether a config was found.
 */
async function hasResolvableConfig() {
	const { default: stylelint } = await import( 'stylelint' );
	try {
		// index.css is a dummy anchor — it doesn't need to exist.
		// resolveConfig walks up from cwd, so ancestor configs
		// (monorepo root, $HOME) are found too, unlike the old
		// hasProjectFile check which only looked at the project dir.
		const config = await stylelint.resolveConfig( 'index.css', {
			cwd: process.cwd(),
		} );
		return config !== undefined;
	} catch ( err ) {
		// Stylelint throws with code 78 when no config is found;
		// inject the bundled default.
		// Other errors mean the config exists but is broken;
		// let stylelint report them during linting.
		if ( err.code === CONFIG_NOT_FOUND_CODE ) {
			return false;
		}
		return true;
	}
}

async function main() {
	const args = getArgsFromCLI();

	const defaultFilesArgs = hasFileArgInCLI()
		? []
		: [ '**/*.{css,pcss,scss}' ];

	// See: https://github.com/stylelint/stylelint/blob/HEAD/docs/user-guide/ignore-code.md#files-entirely.
	const hasIgnoredFiles =
		hasArgInCLI( '--ignore-path' ) || hasProjectFile( '.stylelintignore' );

	const defaultIgnoreArgs = ! hasIgnoredFiles
		? [ '--ignore-path', fromConfigRoot( '.stylelintignore' ) ]
		: [];

	// See: https://stylelint.io/user-guide/configure/
	const hasLintConfig =
		hasArgInCLI( '--config' ) || ( await hasResolvableConfig() );

	const defaultConfigArgs = ! hasLintConfig
		? [ '--config', fromConfigRoot( '.stylelintrc.json' ) ]
		: [];

	const result = spawn(
		resolveBin( 'stylelint' ),
		[
			...defaultConfigArgs,
			...defaultIgnoreArgs,
			...args,
			...defaultFilesArgs,
		],
		{ stdio: 'inherit' }
	);

	process.exit( result.status );
}

main();
