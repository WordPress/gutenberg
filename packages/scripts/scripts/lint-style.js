/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	getArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	hasProjectFile,
	hasPackageProp,
	searchConfig,
} = require( '../utils' );

const args = getArgsFromCLI();

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '**/*.{css,pcss,scss}' ];

// See: https://stylelint.io/user-guide/configuration
const hasLintConfig =
	hasArgInCLI( '--config' ) ||
	searchConfig( 'stylelint' ) ||
	hasPackageProp( 'stylelint' );

const defaultConfigArgs = ! hasLintConfig
	? [ '--config', fromConfigRoot( '.stylelintrc.json' ) ]
	: [];

// See: https://github.com/stylelint/stylelint/blob/HEAD/docs/user-guide/ignore-code.md#files-entirely.
const hasIgnoredFiles =
	hasArgInCLI( '--ignore-path' ) || hasProjectFile( '.stylelintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles
	? [ '--ignore-path', fromConfigRoot( '.stylelintignore' ) ]
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
