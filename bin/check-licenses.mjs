#!/usr/bin/env node

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import {
	checkDeps,
	getLicenses,
	resolvePackagePath,
	readPackageJson,
} from '../packages/scripts/utils/license.js';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '..' );

/*
 * This script checks licenses for production dependencies of packages that are
 * shipped with WordPress (those with wpScript or wpScriptModuleExports in package.json).
 *
 * It works independently of the package manager (npm, pnpm, etc.) by:
 * 1. Reading package.json files to find wpScript packages
 * 2. Reading their production dependencies
 * 3. Resolving each dependency using Node's module resolution
 * 4. Reading the license from each resolved package
 */

/**
 * Get all production dependencies for packages with wpScript or wpScriptModuleExports.
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
	gpl2: true,
} );
