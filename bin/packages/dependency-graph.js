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

/**
 * Get WordPress package dependencies from a package.json file.
 *
 * @param {string} packageName The name of the package.
 * @return {string[]} Array of WordPress package names this package depends on.
 */
function getWordPressDependencies( packageName ) {
	const packageJsonPath = path.join(
		PACKAGES_DIR,
		packageName,
		'package.json'
	);

	try {
		const packageJson = JSON.parse(
			fs.readFileSync( packageJsonPath, 'utf8' )
		);
		const deps = packageJson.dependencies || {};

		// Extract @wordpress/* package names (without @wordpress/ prefix)
		return Object.keys( deps )
			.filter( ( dep ) => dep.startsWith( '@wordpress/' ) )
			.map( ( dep ) => dep.replace( '@wordpress/', '' ) );
	} catch ( error ) {
		// If package.json doesn't exist or can't be read, return empty array
		return [];
	}
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

module.exports = {
	getWordPressDependencies,
	buildDependencyGraph,
	topologicalSort,
	groupByDepth,
};
