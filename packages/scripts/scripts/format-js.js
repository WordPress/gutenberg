/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
const { sync: dirGlob } = require( 'dir-glob' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	fromProjectRoot,
	getArgFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasPackageProp,
	hasProjectFile,
} = require( '../utils' );

// See: https://prettier.io/docs/en/configuration.html
const hasProjectPrettierConfig =
	hasProjectFile( '.prettierrc' ) ||
	hasProjectFile( '.prettierrc.json' ) ||
	hasProjectFile( '.prettierrc.yaml' ) ||
	hasProjectFile( '.prettierrc.yml' ) ||
	hasProjectFile( '.prettierrc.js' ) ||
	hasProjectFile( '.prettierrc.config.js' ) ||
	hasProjectFile( '.prettierrc.toml' ) ||
	hasPackageProp( 'prettier' );

// Get the configuration file, with preference highest to lowers:
// 1. use the `--config` arg from CLI
// 2. use configuration provided by the project
// 3. use the default provided in the scripts module
let configArgs;
const configFromCLI = getArgFromCLI( '--config' );
if ( configFromCLI ) {
	configArgs = [ '--config', configFromCLI ];
} else if ( hasProjectPrettierConfig ) {
	configArgs = []; // no `--config` when project configuration is found: Prettier will find it
} else {
	configArgs = [ '--config', fromConfigRoot( '.prettierrc.js' ) ];
}

// If `--ignore-path` is not explicitly specified, use the project's or global .eslintignore
let ignorePath = getArgFromCLI( '--ignore-path' );
if ( ! ignorePath ) {
	if ( hasProjectFile( '.eslintignore' ) ) {
		ignorePath = fromProjectRoot( '.eslintignore' );
	} else {
		ignorePath = fromConfigRoot( '.eslintignore' );
	}
}
const ignoreArgs = [ '--ignore-path', ignorePath ];

// forward the --require-pragma option that formats only files that already have the @format
// pragma in the first docblock.
const pragmaArgs = hasArgInCLI( '--require-pragma' ) ? [ '--require-pragma' ] : [];

// Get the files and directories to format and convert them to globs
let fileArgs = getFileArgsFromCLI();
if ( fileArgs.length === 0 ) {
	fileArgs = [ '.' ];
}

// Converts `foo/bar` directory to `foo/bar/**/*.js`
const globArgs = dirGlob( fileArgs, { extensions: [ 'js' ] } );

const result = spawn(
	resolveBin( 'prettier' ),
	[ '--write', ...configArgs, ...ignoreArgs, ...pragmaArgs, ...globArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
