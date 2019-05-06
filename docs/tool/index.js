/**
 * Node dependencies
 */
const fs = require( 'fs' );
const { join } = require( 'path' );
const { execSync } = require( 'child_process' );

/**
 * Internal dependencies
 */
const config = require( './config' );
const { getPackageManifest, getRootManifest } = require( './manifest' );

// Update data files from code
execSync( join( __dirname, 'update-data.js' ) );

const rootManifest = getRootManifest( config.tocFileName );
const packageManifest = getPackageManifest( config.packageFileNames );

fs.writeFileSync(
	config.manifestOutput,
	JSON.stringify( rootManifest.concat( packageManifest ), undefined, '\t' )
);
