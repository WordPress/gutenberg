/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	hasArgInCLI,
} = require( '../utils' );

const args = getArgsFromCLI();

const hasConfig = hasArgInCLI( '--package' ) ||
	hasArgInCLI( '--node' ) ||
	hasArgInCLI( '--npm' ) ||
	hasArgInCLI( '--yarn' );
const config = ! hasConfig ?
	[
		'--node', '>=10.0.0',
		'--npm', '>=6.0.0',
	] :
	[];

const result = spawn(
	resolveBin( 'check-node-version' ),
	[ ...config, ...args ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
