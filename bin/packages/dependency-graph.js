/**
 * Dependency graph utilities for WordPress packages.
 *
 * This module provides functions to analyze dependencies between @wordpress/* packages
 * and determine the correct build order using topological sorting.
 */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const toposort = require( 'toposort' );

const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

// Cache for package.json data
const packageJsonCache = new Map();

/**
 * Get package.json info for a WordPress package.
 *
 * @param {string} packageName The package name.
 * @return {Object|null} Package.json object or null if not found.
 */
function getPackageInfo( packageName ) {
	if ( packageJsonCache.has( packageName ) ) {
		return packageJsonCache.get( packageName );
	}

	const packageJsonPath = path.join(
		PACKAGES_DIR,
		packageName,
		'package.json'
	);

	try {
		const packageJson = JSON.parse(
			fs.readFileSync( packageJsonPath, 'utf8' )
		);
		packageJsonCache.set( packageName, packageJson );
		return packageJson;
	} catch ( error ) {
		packageJsonCache.set( packageName, null );
		return null;
	}
}

/**
 * Check if a package is a script or script module.
 * A package is a script if it has wpScript or wpScriptModuleExports.
 *
 * @param {string} packageName The package name.
 * @return {boolean} True if the package is a script or script module.
 */
function isScriptOrModule( packageName ) {
	const packageJson = getPackageInfo( packageName );
	if ( ! packageJson ) {
		return false;
	}
	return !! ( packageJson.wpScript || packageJson.wpScriptModuleExports );
}

/**
 * Get WordPress package dependencies from a package.json file.
 *
 * @param {string} packageName The name of the package.
 * @return {string[]} Array of WordPress package names this package depends on.
 */
function getWordPressDependencies( packageName ) {
	const packageJson = getPackageInfo( packageName );
	if ( ! packageJson ) {
		return [];
	}

	const deps = packageJson.dependencies || {};

	// Extract @wordpress/* package names (without @wordpress/ prefix)
	return Object.keys( deps )
		.filter( ( dep ) => dep.startsWith( '@wordpress/' ) )
		.map( ( dep ) => dep.replace( '@wordpress/', '' ) );
}

/**
 * Build a dependency graph for the given packages.
 *
 * @param {string[]} packages Array of package names to analyze.
 * @return {Array<[string, string]>} Array of [dependent, dependency] edges.
 */
function buildDependencyGraph( packages ) {
	const edges = [];
	const packagesSet = new Set( packages );

	for ( const packageName of packages ) {
		const deps = getWordPressDependencies( packageName );

		// Only include edges where both packages are in our list
		for ( const dep of deps ) {
			if ( packagesSet.has( dep ) ) {
				edges.push( [ packageName, dep ] );
			}
		}

		// If package has no dependencies in our list, add a self-reference
		// This ensures it appears in the sorted output
		if ( deps.filter( ( dep ) => packagesSet.has( dep ) ).length === 0 ) {
			edges.push( [ packageName, packageName ] );
		}
	}

	return edges;
}

/**
 * Sort packages in topological order based on their dependencies.
 *
 * @param {string[]} packages Array of package names to sort.
 * @return {string[]} Sorted array where dependencies come before dependents.
 */
function topologicalSort( packages ) {
	const edges = buildDependencyGraph( packages );

	try {
		// toposort returns dependencies first, then dependents
		const sorted = toposort( edges );

		// Filter to only include packages in our input list
		// (toposort might include extra nodes)
		const packagesSet = new Set( packages );
		return sorted.filter( ( pkg ) => packagesSet.has( pkg ) );
	} catch ( error ) {
		if ( error.message.includes( 'cyclic' ) ) {
			console.error(
				'❌ Cyclic dependency detected in packages:',
				error.message
			);
			throw new Error(
				'Cannot build packages due to cyclic dependencies'
			);
		}
		throw error;
	}
}

/**
 * Group packages by dependency depth level.
 * Packages at the same depth level can be built in parallel.
 *
 * @param {string[]} packages Array of package names to group.
 * @return {string[][]} Array of arrays, where each inner array is a depth level.
 */
function groupByDepth( packages ) {
	const packagesSet = new Set( packages );
	const depths = new Map();
	const visited = new Set();

	/**
	 * Calculate depth for a package recursively.
	 *
	 * @param {string} packageName Package name to calculate depth for.
	 * @return {number} Depth level (0 = no dependencies).
	 */
	function calculateDepth( packageName ) {
		if ( depths.has( packageName ) ) {
			return depths.get( packageName );
		}

		// Prevent infinite loops in case of circular dependencies
		if ( visited.has( packageName ) ) {
			return 0;
		}

		visited.add( packageName );

		const deps = getWordPressDependencies( packageName );
		const relevantDeps = deps.filter( ( dep ) => packagesSet.has( dep ) );

		if ( relevantDeps.length === 0 ) {
			depths.set( packageName, 0 );
			return 0;
		}

		const maxDepth = Math.max(
			...relevantDeps.map( ( dep ) => calculateDepth( dep ) )
		);
		const depth = maxDepth + 1;
		depths.set( packageName, depth );

		return depth;
	}

	// Calculate depth for all packages
	for ( const packageName of packages ) {
		calculateDepth( packageName );
	}

	// Group by depth
	const levels = [];
	const maxDepth = Math.max( ...depths.values() );

	for ( let depth = 0; depth <= maxDepth; depth++ ) {
		const packagesAtDepth = packages.filter(
			( pkg ) => depths.get( pkg ) === depth
		);
		if ( packagesAtDepth.length > 0 ) {
			levels.push( packagesAtDepth );
		}
	}

	return levels;
}

/**
 * Get packages that depend on a given package (reverse dependencies).
 *
 * @param {string}   packageName The package to find dependents of.
 * @param {string[]} allPackages Array of all package names to search.
 * @return {string[]} Array of package names that depend on the given package.
 */
function getReverseDependencies( packageName, allPackages ) {
	const dependents = [];

	for ( const pkg of allPackages ) {
		const deps = getWordPressDependencies( pkg );
		if ( deps.includes( packageName ) ) {
			dependents.push( pkg );
		}
	}

	return dependents;
}

/**
 * Find scripts/script-modules that need to be rebundled when a bundled package changes.
 * Uses BFS to traverse reverse dependencies, stopping at script/module boundaries.
 *
 * When a bundled package (no wpScript/wpScriptModuleExports) changes, we need to
 * rebundle any scripts/modules that depend on it through a chain of bundled packages.
 * We stop at script/module boundaries because they handle their own bundling.
 *
 * Example:
 * - A (bundled) changes
 * - B (bundled) depends on A
 * - C (script) depends on B
 * - D (script) depends on C
 * Result: Only C needs rebundling (D stops at C boundary)
 *
 * @param {string}   changedPackage The bundled package that changed.
 * @param {string[]} allPackages    Array of all package names.
 * @return {string[]} Array of script/module package names to rebundle.
 */
function findScriptsToRebundle( changedPackage, allPackages ) {
	// If the changed package itself is a script/module, no need to find others
	// (it will be rebuilt by the regular watch logic)
	if ( isScriptOrModule( changedPackage ) ) {
		return [];
	}

	const scriptsToRebundle = new Set();
	const visited = new Set();
	const queue = [ changedPackage ];

	while ( queue.length > 0 ) {
		const currentPackage = queue.shift();

		if ( visited.has( currentPackage ) ) {
			continue;
		}
		visited.add( currentPackage );

		// Get all packages that depend on the current package
		const dependents = getReverseDependencies(
			currentPackage,
			allPackages
		);

		for ( const dependent of dependents ) {
			// If this dependent is a script/module, add it to the result
			// but don't traverse further (stop at script boundaries)
			if ( isScriptOrModule( dependent ) ) {
				scriptsToRebundle.add( dependent );
			} else if ( ! visited.has( dependent ) ) {
				// If it's a bundled package, continue traversing
				queue.push( dependent );
			}
		}
	}

	return Array.from( scriptsToRebundle );
}

module.exports = {
	getWordPressDependencies,
	buildDependencyGraph,
	topologicalSort,
	groupByDepth,
	getPackageInfo,
	isScriptOrModule,
	getReverseDependencies,
	findScriptsToRebundle,
};
