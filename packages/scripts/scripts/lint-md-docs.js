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

// See: https://github.com/igorshubovych/markdownlint-cli#configuration
// Check if specified on command-line or project file for config.
const hasLintConfig =
	hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--config' ) ||
	hasProjectFile( '.markdownlint.json' ) ||
	hasProjectFile( '.markdownlint.yaml' ) ||
	hasProjectFile( '.markdownlint.yml' ) ||
	hasProjectFile( '.markdownlintrc' );

// When a configuration is not provided by the project, use from the default
// provided with the scripts module.
const defaultConfigArgs = ! hasLintConfig
	? [ '--config', fromConfigRoot( '.markdownlint.json' ) ]
	: [];

// See: https://github.com/igorshubovych/markdownlint-cli#ignoring-files
// Check if ignore specified on command-line or project file.
const hasIgnoredFiles =
	hasArgInCLI( '--ignore' ) ||
	hasArgInCLI( '-i' ) ||
	hasProjectFile( '.markdownlintignore' );

// Default ignore [ build, node_modules ] directories.
const defaultIgnoreArgs = ! hasIgnoredFiles
	? [ '--ignore-path', fromConfigRoot( '.markdownlintignore' ) ]
	: [];

const result = spawn(
	resolveBin( 'markdownlint-cli', { executable: 'markdownlint' } ),
	[
		...defaultConfigArgs,
		...defaultIgnoreArgs,
		...args,
		...defaultFilesArgs,
	],
	{ stdio: 'inherit' }
);

process.exit( result.status );
