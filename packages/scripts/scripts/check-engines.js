const path = require( 'path' );
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
const { getArgsFromCLI, hasArgInCLI, getPackageProp } = require( '../utils' );
const { getPackagePath } = require( '../utils/package' );

const hasConfig =
	hasArgInCLI( '--package' ) ||
	hasArgInCLI( '--node' ) ||
	hasArgInCLI( '--npm' ) ||
	hasArgInCLI( '--yarn' );

// `--package` reads `engines` from the `package.json` in the working directory.
const getEnginesDirectory = () =>
	path.dirname(
		getPackageProp( 'engines' )
			? getPackagePath()
			: require.resolve( '../package.json' )
	);

const result = spawn(
	resolveBin( 'check-node-version' ),
	[ ...( hasConfig ? [] : [ '--package' ] ), ...getArgsFromCLI() ],
	{
		cwd: hasConfig ? undefined : getEnginesDirectory(),
		stdio: 'inherit',
	}
);

process.exit( result.status );
