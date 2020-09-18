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
} = require( '../utils' );

const args = getArgsFromCLI();

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '**/*.{css,scss}' ];

// See: https://stylelint.io/user-guide/configuration
const hasLintConfig =
	hasArgInCLI( '--config' ) ||
	hasProjectFile( '.stylelintrc.js' ) ||
	hasProjectFile( '.stylelintrc.json' ) ||
	hasProjectFile( '.stylelintrc.yaml' ) ||
	hasProjectFile( '.stylelintrc.yml' ) ||
	hasProjectFile( 'stylelint.config.js' ) ||
	hasProjectFile( '.stylelintrc' ) ||
	hasPackageProp( 'stylelint' );

const defaultConfigArgs = ! hasLintConfig
	? [ '--config', fromConfigRoot( '.stylelintrc.json' ) ]
	: [];

// See: https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md#stylelintignore.
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
