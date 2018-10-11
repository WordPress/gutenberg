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
	hasPackageProp,
	hasProjectFile,
} = require( '../utils' );

const args = getCliArgs();

const hasLintConfig = hasCliArg( '-c' ) ||
	hasCliArg( '--config' ) ||
	hasProjectFile( '.eslintrc.js' ) ||
	hasProjectFile( '.eslintrc.yaml' ) ||
	hasProjectFile( '.eslintrc.yml' ) ||
	hasProjectFile( '.eslintrc.json' ) ||
	hasProjectFile( '.eslintrc' ) ||
	hasPackageProp( 'eslintConfig' );

const config = ! hasLintConfig ?
	[ '--config', fromConfigRoot( '.eslintrc.js' ) ] :
	[];

const result = spawn(
	resolveBin( 'eslint' ),
	[ ...config, ...args ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
