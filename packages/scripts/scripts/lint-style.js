/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
// const stylelint = require( 'stylelint' );

function isNoConfigFoundError( err ) {
	return (
		err.code === 78 && err.message.startsWith( 'No configuration provided' )
	);
}

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
		if ( isNoConfigFoundError( err ) ) {
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
