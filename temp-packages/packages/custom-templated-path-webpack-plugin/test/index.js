/**
 * External dependencies
 */

const path = require( 'path' );
const { promisify } = require( 'util' );
const webpack = promisify( require( 'webpack' ) );
const fs = require( 'fs' );
const access = promisify( fs.access );
const unlink = promisify( fs.unlink );

/**
 * Internal dependencies
 */

const config = require( './fixtures/webpack.config.js' );
const CustomTemplatedPathPlugin = require( '../' );

describe( 'CustomTemplatedPathPlugin', () => {
	const outputFile = path.join( __dirname, '/fixtures/entry.js' )

	beforeAll( async () => {
		// Remove output file so as not to report false positive from previous
		// test. Absorb error since the file may not exist (unlink will throw).
		try {
			await unlink( outputFile );
		} catch ( error ) {}
	} );

	it( 'should resolve with basename output', async () => {
		const stats = await webpack( config );
		await access( outputFile );
	} );
} );
