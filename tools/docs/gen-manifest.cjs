/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getRootManifest } = require( './manifest.cjs' );

const tocFileInput = path.resolve( __dirname, '../../docs/toc.json' );
const manifestOutput = path.resolve( __dirname, '../../docs/manifest.json' );

// Process TOC file and generate manifest handbook.
fs.writeFileSync(
	manifestOutput,
	JSON.stringify( getRootManifest( tocFileInput ), undefined, '\t' ).concat(
		'\n'
	)
);
