/**
 * Internal dependencies
 */
const { getArgFromCLI, hasArgInCLI } = require( '../utils' );
const {
	checkDeps,
	getLicenses,
	resolvePackagePath,
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

/**
 * Get dependencies to check based on the current package.json.
 * Uses Node's module resolution which works with any package manager.
 *
 * @return {Array} Array of dependency objects with name, version, path, and license
 */
function getDependenciesToCheck() {
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

	const licenses = getLicenses( gpl2 );
	const depsMap = new Map();
	const visited = new Set();

	/**
	 * Recursively collect dependencies.
	 *
	 * @param {Object} deps    - Dependencies object from package.json
	 * @param {string} fromDir - Directory to resolve from
	 */
	function collectDeps( deps, fromDir ) {
		if ( ! deps ) {
			return;
		}

		for ( const depName of Object.keys( deps ) ) {
			const depPath = resolvePackagePath( depName, fromDir );
			if ( ! depPath ) {
				continue;
			}

			// Avoid infinite loops
			if ( visited.has( depPath ) ) {
				continue;
			}
			visited.add( depPath );

			const depPkgJson = readPackageJson( depPath );
			if ( ! depPkgJson ) {
				continue;
			}

			const key = `${ depName }@${ depPkgJson.version }`;
			if ( ! depsMap.has( key ) ) {
				const license = depPkgJson.license;

				// Skip if license is in the allowed list
				if ( ! license || ! licenses.includes( license ) ) {
					depsMap.set( key, {
						name: depName,
						version: depPkgJson.version,
						path: depPath,
						license,
					} );
				}
			}

			// Recursively check this package's dependencies
			collectDeps( depPkgJson.dependencies, depPath );
		}
	}

	collectDeps( depsToCheck, cwd );

	return Array.from( depsMap.values() );
}

const packages = getDependenciesToCheck();

checkDeps( packages, { ignored, gpl2 } );
