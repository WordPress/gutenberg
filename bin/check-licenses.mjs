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
	collectDeps,
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

const packagesDir = path.join( ROOT_DIR, 'packages' );
const depsMap = new Map();
const visited = new Set();

// Find all workspace packages with wpScript or wpScriptModuleExports
for ( const dir of fs.readdirSync( packagesDir ) ) {
	const pkgDir = path.join( packagesDir, dir );
	const pkgJson = readPackageJson( pkgDir );

	if ( pkgJson?.wpScript || pkgJson?.wpScriptModuleExports ) {
		collectDeps( pkgJson.dependencies, pkgDir, {
			gpl2: true,
			depsMap,
			visited,
			shouldSkip: ( depName ) => depName.startsWith( '@wordpress/' ),
		} );
	}
}

checkDeps( Array.from( depsMap.values() ), {
	gpl2: true,
} );
