/**
 * Node dependencies
 */
const fs = require( 'fs' );
const { join } = require( 'path' );
const { execSync } = require( 'child_process' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getRootManifest } = require( './manifest' );

const tocFileInput = path.resolve( __dirname, '../toc.json' );
const manifestOutput = path.resolve( __dirname, '../manifest.json' );

// Update data files from code
execSync( join( __dirname, 'update-data.js' ) );

// Process TOC file and generate manifest handbook
fs.writeFileSync( manifestOutput, JSON.stringify( getRootManifest( tocFileInput ), undefined, '\t' ) );
