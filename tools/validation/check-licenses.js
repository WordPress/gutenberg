#!/usr/bin/env node
'use strict';

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const {
	checkDeps,
	collectDeps,
	readPackageJson,
} = require( '@wordpress/scripts/utils/license.js' );

const ROOT_DIR = path.resolve( __dirname, '../..' );
const packagesDir = path.join( ROOT_DIR, 'packages' );
const depsMap = new Map();
const visited = new Set();

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
