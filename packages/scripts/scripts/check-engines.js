/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const { getArgsFromCLI, hasArgInCLI, getPackageProp } = require( '../utils' );

const getConfig = () => {
	const hasConfig =
		hasArgInCLI( '--package' ) ||
		hasArgInCLI( '--node' ) ||
		hasArgInCLI( '--npm' ) ||
		hasArgInCLI( '--yarn' );

	if ( hasConfig ) {
		return [];
	}
	const { node, npm } =
		getPackageProp( 'engines' ) || require( '../package.json' ).engines;

	return [ '--node', node, '--npm', npm ];
};

const result = spawn(
	resolveBin( 'check-node-version' ),
	[ ...getConfig(), ...getArgsFromCLI() ],
	{
		stdio: 'inherit',
	}
);

process.exit( result.status );
