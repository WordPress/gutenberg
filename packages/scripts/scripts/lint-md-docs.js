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

// See: https://github.com/igorshubovych/markdownlint-cli#usage
const hasLintConfig = hasArgInCLI( '-c' ) || hasArgInCLI( '--config' );

// When a configuration is not provided by the project, use from the default
// provided with the scripts module.
const defaultConfigArgs = ! hasLintConfig ?
	[ '--config', fromConfigRoot( '.markdownlint.json' ) ] :
	[];

// See: https://github.com/igorshubovych/markdownlint-cli#ignoring-files
const hasIgnoredFiles = hasArgInCLI( '--ignore' ) ||
	hasProjectFile( '.markdownlintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles ?
	[ '--ignore', 'build', '--ignore', 'node_modules' ] :
	[];

const result = spawn(
	resolveBin( 'markdownlint-cli', { executable: 'markdownlint' } ),
	[ ...defaultConfigArgs, ...defaultIgnoreArgs, ...args, ...defaultFilesArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
