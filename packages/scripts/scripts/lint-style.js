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
	hasProjectFile,
	hasPackageProp,
} = require( '../utils' );

const args = getCliArgs();

// See: https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md#loading-the-configuration-object.
const hasLintConfig = hasCliArg( '--config' ) ||
	hasProjectFile( '.stylelintrc' ) ||
	hasProjectFile( '.stylelintrc.js' ) ||
	hasProjectFile( '.stylelintrc.json' ) ||
	hasProjectFile( '.stylelintrc.yaml' ) ||
	hasProjectFile( '.stylelintrc.yml' ) ||
	hasProjectFile( '.stylelint.config.js' ) ||
	hasPackageProp( 'stylelint' );

const config = ! hasLintConfig ?
	[ '--config', fromConfigRoot( '.stylelintrc.json' ) ] :
	[];

// See: https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md#stylelintignore.
const hasIgnoredFiles = hasCliArg( '--ignore-path' ) ||
	hasProjectFile( '.stylelintignore' );

const defaultIgnoreArgs = ! hasIgnoredFiles ?
	[ '--ignore-path', fromConfigRoot( '.stylelintignore' ) ] :
	[];

const result = spawn(
	resolveBin( 'stylelint' ),
	[ ...config, ...defaultIgnoreArgs, ...args ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
