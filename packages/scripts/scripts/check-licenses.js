/**
 * Internal dependencies
 */
const { getArgFromCLI, hasArgInCLI } = require( '../utils' );
const {
	checkDeps,
	collectDeps,
	readPackageJson,
} = require( '../utils/license' );

/*
 * WARNING: Changes to this file may inadvertently cause us to distribute code that
 * is not GPL2 compatible.
 *
 * When adding a new license (for example, when a new package has a variation of the
 * various license strings), please ensure that changes to this file are explicitly
 * reviewed and approved.
 */

const prod = hasArgInCLI( '--prod' ) || hasArgInCLI( '--production' );
const dev = hasArgInCLI( '--dev' ) || hasArgInCLI( '--development' );
const gpl2 = hasArgInCLI( '--gpl2' );
const ignored = hasArgInCLI( '--ignore' )
	? getArgFromCLI( '--ignore' )
			// "--ignore=a, b" -> "[ 'a', ' b' ]"
			.split( ',' )
			// "[ 'a', ' b' ]" -> "[ 'a', 'b' ]"
			.map( ( moduleName ) => moduleName.trim() )
	: [];

const cwd = process.cwd();
const pkgJson = readPackageJson( cwd );

if ( ! pkgJson ) {
	process.stdout.write(
		'Unable to find package.json in current directory.\n'
	);
	process.exit( 1 );
}

let depsToCheck = {};
if ( prod ) {
	depsToCheck = pkgJson.dependencies || {};
} else if ( dev ) {
	depsToCheck = pkgJson.devDependencies || {};
} else {
	depsToCheck = {
		...( pkgJson.dependencies || {} ),
		...( pkgJson.devDependencies || {} ),
	};
}

const depsMap = new Map();
collectDeps( depsToCheck, cwd, {
	gpl2,
	depsMap,
	visited: new Set(),
} );

checkDeps( Array.from( depsMap.values() ), { ignored, gpl2 } );
