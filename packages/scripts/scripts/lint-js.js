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
	hasPackageProp,
	hasProjectFile,
} = require( '../utils' );

const args = getArgsFromCLI();

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '.' ];

// See: https://eslint.org/docs/user-guide/configuring#using-configuration-files-1.
const hasLintConfig =
	hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--config' ) ||
	hasProjectFile( '.eslintrc.js' ) ||
	hasProjectFile( '.eslintrc.json' ) ||
	hasProjectFile( '.eslintrc.yaml' ) ||
	hasProjectFile( '.eslintrc.yml' ) ||
	hasProjectFile( 'eslintrc.config.js' ) ||
	hasProjectFile( '.eslintrc' ) ||
	hasPackageProp( 'eslintConfig' );

// When a configuration is not provided by the project, use from the default
// provided with the scripts module. Instruct ESLint to avoid discovering via
// the `--no-eslintrc` flag, as otherwise it will still merge with inherited.
const defaultConfigArgs = ! hasLintConfig
	? [ '--no-eslintrc', '--config', fromConfigRoot( '.eslintrc.js' ) ]
	: [];

// See: https://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories.
const hasIgnoredFiles =
	hasArgInCLI( '--ignore-path' ) || hasProjectFile( '.eslintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles
	? [ '--ignore-path', fromConfigRoot( '.eslintignore' ) ]
	: [];

const defaultExtArgs = hasArgInCLI( '--ext' )
	? []
	: [ '--ext', 'js,cjs,mjs,jsx,ts,cts,mts,tsx' ];

const result = spawn(
	resolveBin( 'eslint' ),
	[
		...defaultConfigArgs,
		...defaultIgnoreArgs,
		...defaultExtArgs,
		...args,
		...defaultFilesArgs,
	],
	{ stdio: 'inherit' }
);

process.exit( result.status );
