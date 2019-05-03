/**
 * Node dependencies
 */
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const config = require( './config' );
const { getPackageManifest, getComponentManifest, getRootManifest } = require( './manifest' );

const rootManifest = getRootManifest( config.tocFileName );
const packageManifest = getPackageManifest( config.packageFileNames );
const componentManifest = getComponentManifest( config.componentPaths );

fs.writeFileSync(
	config.manifestOutput,
	JSON.stringify( rootManifest.concat( packageManifest, componentManifest ), undefined, '\t' )
);
