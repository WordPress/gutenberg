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
	getCliArgs,
	hasCliArg,
	hasFileInCliArgs,
	hasPackageProp,
	hasProjectFile,
} = require( '../utils' );

const args = getCliArgs();

const defaultFilesArgs = ! hasFileInCliArgs ? [ '.' ] : [];

// See: https://eslint.org/docs/user-guide/configuring#using-configuration-files-1.
const hasLintConfig = hasCliArg( '-c' ) ||
	hasCliArg( '--config' ) ||
	hasProjectFile( '.eslintrc.js' ) ||
	hasProjectFile( '.eslintrc.yaml' ) ||
	hasProjectFile( '.eslintrc.yml' ) ||
	hasProjectFile( '.eslintrc.json' ) ||
	hasProjectFile( '.eslintrc' ) ||
	hasPackageProp( 'eslintConfig' );

// When a configuration is not provided by the project, use from the default
// provided with the scripts module. Instruct ESLint to avoid discovering via
// the `--no-eslintrc` flag, as otherwise it will still merge with inherited.
const defaultConfigArgs = ! hasLintConfig ?
	[ '--no-eslintrc', '--config', fromConfigRoot( '.eslintrc.js' ) ] :
	[];

// See: https://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories.
const hasIgnoredFiles = hasCliArg( '--ignore-path' ) ||
	hasProjectFile( '.eslintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles ?
	[ '--ignore-path', fromConfigRoot( '.eslintignore' ) ] :
	[];

const result = spawn(
	resolveBin( 'eslint' ),
	[ ...defaultConfigArgs, ...defaultIgnoreArgs, ...args, ...defaultFilesArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
