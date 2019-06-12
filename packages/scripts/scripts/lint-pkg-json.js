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
	hasProjectFile,
	hasPackageProp,
} = require( '../utils' );

const args = getCliArgs();

const defaultFilesArgs = hasFileInCliArgs() ? [] : [ '.' ];

// See: https://github.com/tclindner/npm-package-json-lint/wiki/configuration#configuration.
const hasLintConfig = hasCliArg( '-c' ) ||
	hasCliArg( '--configFile' ) ||
	hasProjectFile( '.npmpackagejsonlintrc.json' ) ||
	hasProjectFile( 'npmpackagejsonlint.config.js' ) ||
	hasPackageProp( 'npmPackageJsonLintConfig' );

const defaultConfigArgs = ! hasLintConfig ?
	[ '--configFile', fromConfigRoot( 'npmpackagejsonlint.json' ) ] :
	[];

// See: https://github.com/tclindner/npm-package-json-lint/#cli-commands-and-configuration.
const hasIgnoredFiles = hasCliArg( '--ignorePath' ) ||
	hasProjectFile( '.npmpackagejsonlintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles ?
	[ '--ignorePath', fromConfigRoot( '.npmpackagejsonlintignore' ) ] :
	[];

const result = spawn(
	resolveBin( 'npm-package-json-lint', { executable: 'npmPkgJsonLint' } ),
	[ ...defaultConfigArgs, ...defaultIgnoreArgs, ...args, ...defaultFilesArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
