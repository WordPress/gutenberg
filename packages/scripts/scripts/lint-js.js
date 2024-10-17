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

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '.' ];

// See: https://eslint.org/docs/latest/use/configure/configuration-files.
const hasLintConfig =
	hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'eslint.config.js' ) ||
	hasProjectFile( 'eslint.config.mjs' ) ||
	hasProjectFile( 'eslint.config.cjs' ) ||
	hasProjectFile( 'eslint.config.ts' ) ||
	hasProjectFile( 'eslint.config.mts' ) ||
	hasProjectFile( 'eslint.config.cts' );

// When a configuration is not provided by the project, use from the default
// provided with the scripts module. Instruct ESLint to avoid discovering via
// the `--no-eslintrc` flag, as otherwise it will still merge with inherited.
const defaultConfigArgs = ! hasLintConfig
	? [ '--no-config-lookup', '--config', fromConfigRoot( 'eslint.config.js' ) ]
	: [];

const result = spawn(
	resolveBin( 'eslint' ),
	[ ...defaultConfigArgs, ...args, ...defaultFilesArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
