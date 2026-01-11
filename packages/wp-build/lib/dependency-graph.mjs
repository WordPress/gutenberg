/**
 * Dependency graph utilities for WordPress packages.
 *
 * This module provides functions to analyze dependencies between @wordpress/* packages
 * and determine the correct build order using topological sorting.
 */

import path from 'path';
import { getPackageInfoFromFile } from './package-utils.mjs';

/**
 * Check if a package is a script or script module.
 * A package is a script if it has wpScript or wpScriptModuleExports.
 *
 * @param {import('./package-utils.mjs').PackageJson|null|undefined} packageJson The package.json object.
 * @return {boolean} True if the package is a script or script module.
 */
function isScriptOrModule( packageJson ) {
	if ( ! packageJson ) {
		return false;
	}
	return !! ( packageJson.wpScript || packageJson.wpScriptModuleExports );
}

/**
 * Get package dependencies from a package.json object.
 *
 * @param {import('./package-utils.mjs').PackageJson|null|undefined} packageJson The package.json object.
 * @return {string[]} Array of package names this package depends on.
 */
function getDependencies( packageJson ) {
	if ( ! packageJson ) {
		return [];
	}

	const deps = packageJson.dependencies || {};

	return Object.keys( deps );
}

/**
 * Group packages by dependency depth level.
 * Packages at the same depth level can be built in parallel.
 *
 * @param {Map<string, import('./package-utils.mjs').PackageJson>} packages Map of package names to package.json objects.
 * @return {string[][]} Array of arrays, where each inner array is a depth level containing package names.
 */
function groupByDepth( packages ) {
	const packagesSet = new Set( packages.keys() );
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

		const packageJson = packages.get( packageName );
		const deps = getDependencies( packageJson );
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
	for ( const packageName of packages.keys() ) {
		calculateDepth( packageName );
	}

	// Group by depth
	const levels = [];
	const maxDepth = Math.max( ...depths.values() );

	for ( let depth = 0; depth <= maxDepth; depth++ ) {
		const packagesAtDepth = Array.from( packages.keys() ).filter(
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
 * @param {string}                                                 packageName       The full package name to find dependents of.
 * @param {Map<string, import('./package-utils.mjs').PackageJson>} workspacePackages Map of workspace package names to package.json objects.
 * @return {string[]} Array of package names that depend on the given package.
 */
function getReverseDependencies( packageName, workspacePackages ) {
	const dependents = [];

	for ( const [ pkg, packageJson ] of workspacePackages ) {
		const deps = getDependencies( packageJson );
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
 * @param {string}                                                 changedPackage    The full package name that changed.
 * @param {Map<string, import('./package-utils.mjs').PackageJson>} workspacePackages Map of workspace package names to package.json objects.
 * @return {string[]} Array of script/module package names to rebundle.
 */
function findScriptsToRebundle( changedPackage, workspacePackages ) {
	// If the changed package itself is a script/module, no need to find others
	// (it will be rebuilt by the regular watch logic)
	const changedPackageJson = workspacePackages.get( changedPackage );
	if ( isScriptOrModule( changedPackageJson ) ) {
		return [];
	}

	const scriptsToRebundle = new Set();
	const visited = new Set();
	const queue = [ changedPackage ];

	while ( queue.length > 0 ) {
		const currentPackage = queue.shift();

		if ( ! currentPackage || visited.has( currentPackage ) ) {
			continue;
		}
		visited.add( currentPackage );

		// Get all packages that depend on the current package
		const dependents = getReverseDependencies(
			currentPackage,
			workspacePackages
		);

		for ( const dependent of dependents ) {
			// If this dependent is a script/module, add it to the result
			// but don't traverse further (stop at script boundaries)
			const dependentPackageJson = workspacePackages.get( dependent );
			if ( isScriptOrModule( dependentPackageJson ) ) {
				scriptsToRebundle.add( dependent );
			} else if ( ! visited.has( dependent ) ) {
				// If it's a bundled package, continue traversing
				queue.push( dependent );
			}
		}
	}

	return Array.from( scriptsToRebundle );
}

/**
 * Get package dependencies from a route's package.json file.
 *
 * @param {string} rootDir   Root directory path.
 * @param {string} routeName The route name (e.g., 'home').
 * @return {string[]} Array of package names this route depends on.
 */
function getRouteDependencies( rootDir, routeName ) {
	const packageJson = getPackageInfoFromFile(
		path.join( rootDir, 'routes', routeName, 'package.json' )
	);
	if ( ! packageJson ) {
		return [];
	}

	const deps = packageJson.dependencies || {};

	return Object.keys( deps );
}

/**
 * Find routes that need to be rebuilt when a bundled package changes.
 * Uses BFS to traverse reverse dependencies, stopping at script/module boundaries.
 *
 * When a bundled package changes, we need to rebuild any routes that depend on it
 * through a chain of bundled packages. Routes are leaf nodes like scripts/modules.
 *
 * Example:
 * - A (bundled) changes
 * - B (bundled) depends on A
 * - C (script) depends on B
 * - home (route) depends on B
 * Result: Both C and home need rebuilding
 *
 * @param {string}                                                 changedPackage    The full package name that changed.
 * @param {Map<string, import('./package-utils.mjs').PackageJson>} workspacePackages Map of workspace package names to package.json objects.
 * @param {string}                                                 rootDir           Root directory path.
 * @param {string[]}                                               allRoutes         Array of all route names.
 * @return {string[]} Array of route names to rebuild.
 */
function findRoutesToRebuild(
	changedPackage,
	workspacePackages,
	rootDir,
	allRoutes
) {
	// If the changed package itself is a script/module, routes won't be affected
	// (routes depend on bundled packages, not scripts/modules)
	const changedPackageJson = workspacePackages.get( changedPackage );
	if ( isScriptOrModule( changedPackageJson ) ) {
		return [];
	}

	const routesToRebuild = new Set();
	const visited = new Set();
	const queue = [ changedPackage ];

	while ( queue.length > 0 ) {
		const currentPackage = queue.shift();

		if ( ! currentPackage || visited.has( currentPackage ) ) {
			continue;
		}
		visited.add( currentPackage );

		// Check if any routes depend on the current package
		for ( const route of allRoutes ) {
			const deps = getRouteDependencies( rootDir, route );
			if ( deps.includes( currentPackage ) ) {
				routesToRebuild.add( route );
			}
		}

		// Get all packages that depend on the current package
		const dependents = getReverseDependencies(
			currentPackage,
			workspacePackages
		);

		for ( const dependent of dependents ) {
			// If this dependent is a script/module, don't traverse further
			// (stop at script boundaries)
			const dependentPackageJson = workspacePackages.get( dependent );
			if (
				! isScriptOrModule( dependentPackageJson ) &&
				! visited.has( dependent )
			) {
				// If it's a bundled package, continue traversing
				queue.push( dependent );
			}
		}
	}

	return Array.from( routesToRebuild );
}

export {
	getDependencies,
	groupByDepth,
	isScriptOrModule,
	getReverseDependencies,
	findScriptsToRebundle,
	getRouteDependencies,
	findRoutesToRebuild,
};
