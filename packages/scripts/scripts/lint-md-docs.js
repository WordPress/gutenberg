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
const hasIgnoredFiles = hasArgInCLI( '--ignore' ) || hasArgInCLI( '-i' ) ||
	hasProjectFile( '.markdownlintignore' );

// Default ignore [ build, node_modules ] directories
// TODO: Once https://github.com/igorshubovych/markdownlint-cli/issues/46 is in
// we can switch this to specify an ignore file on the command-line. By default,
// markdownlint looks for .markdownlintignore in project direcotry, but how our
// scripts work we store the configs in the scripts/config directory
const defaultIgnoreArgs = ! hasIgnoredFiles ?
	[ '--ignore', 'build', '--ignore', 'node_modules' ] :
	[];

const result = spawn(
	resolveBin( 'markdownlint-cli', { executable: 'markdownlint' } ),
	[ ...defaultConfigArgs, ...defaultIgnoreArgs, ...args, ...defaultFilesArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
