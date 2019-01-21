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

const hasLintConfig =
	hasCliArg( '--eslint-config-path' ) ||
	hasProjectFile( '.eslintrc.js' ) ||
	hasProjectFile( '.eslintrc.yaml' ) ||
	hasProjectFile( '.eslintrc.yml' ) ||
	hasProjectFile( '.eslintrc.json' ) ||
	hasProjectFile( '.eslintrc' ) ||
	hasPackageProp( 'eslintConfig' );

const lintConfig = ! hasLintConfig ?
	[ '--eslint-config-path', fromConfigRoot( '.eslintrc.js' ) ] :
	[];

const result = spawn(
	resolveBin( 'prettier-eslint-cli', { executable: 'prettier-eslint' } ),
	[ ...lintConfig, '--write', ...getCliArgs() ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
