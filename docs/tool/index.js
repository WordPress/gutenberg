/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getRootManifest } = require( './manifest' );

const tocFileInput = path.resolve( __dirname, '../toc.json' );
const manifestOutput = path.resolve( __dirname, '../manifest.json' );

// Process TOC file and generate manifest handbook.
fs.writeFileSync(
	manifestOutput,
	JSON.stringify( getRootManifest( tocFileInput ), undefined, '\t' ).concat(
		'\n'
	)
);
