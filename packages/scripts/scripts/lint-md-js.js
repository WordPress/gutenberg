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
} = require( '../utils' );

const args = getArgsFromCLI();

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '**/*.md' ];

// See: https://eslint.org/docs/user-guide/configuring#using-configuration-files-1.
const hasLintConfig = hasArgInCLI( '-c' ) || hasArgInCLI( '--config' );

// When a configuration is not provided by the project, use from the default
// provided with the scripts module. Instruct ESLint to avoid discovering via
// the `--no-eslintrc` flag, as otherwise it will still merge with inherited.
const defaultConfigArgs = ! hasLintConfig
	? [ '--no-eslintrc', '--config', fromConfigRoot( '.eslintrc-md.js' ) ]
	: [];

// See: https://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories.
const hasIgnoredFiles =
	hasArgInCLI( '--ignore-path' ) || hasProjectFile( '.eslintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles
	? [ '--ignore-path', fromConfigRoot( '.eslintignore' ) ]
	: [];

const result = spawn(
	resolveBin( 'eslint' ),
	[
		...defaultConfigArgs,
		...defaultIgnoreArgs,
		...args,
		...defaultFilesArgs,
	],
	{ stdio: 'inherit' }
);

process.exit( result.status );
