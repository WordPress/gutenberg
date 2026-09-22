const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
const tools = require( 'check-node-version/tools' );
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
	const engines =
		getPackageProp( 'engines' ) || require( '../package.json' ).engines;

	// Only pass the engines that `check-node-version` knows how to check.
	return Object.entries( engines )
		.filter( ( [ name ] ) => name in tools )
		.flatMap( ( [ name, range ] ) => [ `--${ name }`, range ] );
};

const result = spawn(
	resolveBin( 'check-node-version' ),
	[ ...getConfig(), ...getArgsFromCLI() ],
	{
		stdio: 'inherit',
	}
);

process.exit( result.status );
