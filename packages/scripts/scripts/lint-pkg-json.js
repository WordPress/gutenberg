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

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '.' ];

// See: https://github.com/tclindner/npm-package-json-lint/wiki/configuration#configuration.
const hasLintConfig = hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--configFile' ) ||
	hasProjectFile( '.npmpackagejsonlintrc.json' ) ||
	hasProjectFile( 'npmpackagejsonlint.config.js' ) ||
	hasPackageProp( 'npmpackagejsonlint' ) ||
	// npm-package-json-lint v3.x used a different prop name.
	hasPackageProp( 'npmPackageJsonLintConfig' );

const defaultConfigArgs = ! hasLintConfig ?
	[ '--configFile', fromConfigRoot( 'npmpackagejsonlint.json' ) ] :
	[];

// See: https://github.com/tclindner/npm-package-json-lint/#cli-commands-and-configuration.
const hasIgnoredFiles = hasArgInCLI( '--ignorePath' ) ||
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
