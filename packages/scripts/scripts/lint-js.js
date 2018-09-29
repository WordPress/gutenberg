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
} = require( '../utils' );

const args = getCliArgs();

const hasLintConfig = hasCliArg( '-c' ) ||
	hasCliArg( '--configFile' ) ||
	hasProjectFile( '.eslintrc.js' );

const config = ! hasLintConfig ?
	[ '--configFile', fromConfigRoot( '.eslintrc.js' ) ] :
	[];

const result = spawn(
	resolveBin( 'eslint' ),
	[ ...config, ...args ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
