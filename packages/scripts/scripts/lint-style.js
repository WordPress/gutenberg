/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
const { cosmiconfig } = require( 'cosmiconfig' );

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

	// Use cosmiconfig (stylelint's own config resolver) instead of a static
	// extension list so we automatically support all current and future
	// stylelint config file names and extensions (.ts, etc.).
	// The async API is required over cosmiconfigSync because the latter does not search for .mjs config files.
	// See: https://stylelint.io/user-guide/configure/
	const hasLintConfig =
		hasArgInCLI( '--config' ) ||
		( await cosmiconfig( 'stylelint' ).search( process.cwd() ) ) !== null;

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
