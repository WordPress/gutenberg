#!/usr/bin/env node

/**
 * External dependencies
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { checkDeps, getLicenses } from '../packages/scripts/utils/license.js';

const require = createRequire( import.meta.url );
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '..' );

const ignored = [
	// Nothing ignored for now
];

/*
 * This script checks licenses for production dependencies of packages that are
 * shipped with WordPress (those with wpScript or wpScriptModuleExports in package.json).
 *
 * It works independently of the package manager (npm, pnpm, etc.) by:
 * 1. Reading package.json files to find wpScript packages
 * 2. Reading their production dependencies
 * 3. Resolving each dependency using Node's require.resolve
 * 4. Reading the license from each resolved package
 */

/**
 * Resolve a package's path using Node's resolution algorithm.
 * This works regardless of package manager (npm, pnpm, yarn, etc.).
 *
 * @param {string} packageName - Name of the package to resolve
 * @param {string} fromDir     - Directory to resolve from
 * @return {string|null} Path to the package directory, or null if not found
 */
function resolvePackagePath( packageName, fromDir ) {
	try {
		// Try to resolve the package.json directly first
		const resolved = require.resolve( `${ packageName }/package.json`, {
			paths: [ fromDir ],
		} );
		return path.dirname( resolved );
	} catch {
		// Some packages don't export ./package.json in their exports field.
		// Fall back to resolving the main entry and finding package.json from there.
		try {
			const mainResolved = require.resolve( packageName, {
				paths: [ fromDir ],
			} );
			// Walk up to find package.json
			let dir = path.dirname( mainResolved );
			while ( dir !== path.parse( dir ).root ) {
				if ( fs.existsSync( path.join( dir, 'package.json' ) ) ) {
					return dir;
				}
				dir = path.dirname( dir );
			}
		} catch {
			// Package not found at all
		}
		return null;
	}
}

/**
 * Read package.json from a directory.
 *
 * @param {string} dir - Directory containing package.json
 * @return {Object|null} Parsed package.json or null if not found
 */
function readPackageJson( dir ) {
	const pkgJsonPath = path.join( dir, 'package.json' );
	if ( fs.existsSync( pkgJsonPath ) ) {
		try {
			return JSON.parse( fs.readFileSync( pkgJsonPath, 'utf8' ) );
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Get all production dependencies for packages with wpScript or wpScriptModuleExports.
 * Uses Node's require.resolve to find packages, which works with any package manager.
 *
 * @return {Array} Array of dependency objects with name, version, path, and license
 */
function getDependenciesToProcess() {
	const packagesDir = path.join( ROOT_DIR, 'packages' );
	const licenses = getLicenses( true );
	const depsMap = new Map();
	const visited = new Set();

	/**
	 * Recursively collect production dependencies.
	 *
	 * @param {Object} deps    - Dependencies object from package.json
	 * @param {string} fromDir - Directory to resolve from
	 */
	function collectDeps( deps, fromDir ) {
		if ( ! deps ) {
			return;
		}

		for ( const depName of Object.keys( deps ) ) {
			// Skip workspace packages (they start with @wordpress/)
			if ( depName.startsWith( '@wordpress/' ) ) {
				continue;
			}

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

	// Find all workspace packages with wpScript or wpScriptModuleExports
	for ( const dir of fs.readdirSync( packagesDir ) ) {
		const pkgDir = path.join( packagesDir, dir );
		const pkgJson = readPackageJson( pkgDir );

		if ( pkgJson?.wpScript || pkgJson?.wpScriptModuleExports ) {
			// Collect production dependencies for this package
			collectDeps( pkgJson.dependencies, pkgDir );
		}
	}

	return Array.from( depsMap.values() );
}

const dependenciesToProcess = getDependenciesToProcess();

checkDeps( dependenciesToProcess, {
	ignored,
	gpl2: true,
} );
