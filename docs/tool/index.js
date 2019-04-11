/**
 * Node dependencies
 */
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const config = require( './config' );
const parser = require( './parser' );
const generator = require( './generator' );
const { getPackageManifest, getComponentManifest, getDataManifest, getRootManifest } = require( './manifest' );

const parsedModules = parser( config.dataNamespaces );
generator( parsedModules, config.dataDocsOutput );

const rootManifest = getRootManifest( config.tocFileName );
const packageManifest = getPackageManifest( config.packageFileNames );
const componentManifest = getComponentManifest( config.componentPaths );
const dataManifest = getDataManifest( parsedModules );

fs.writeFileSync(
	config.manifestOutput,
	JSON.stringify( rootManifest.concat( packageManifest, componentManifest, dataManifest ), undefined, '\t' )
);
