/**
 * External dependencies
 */
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;
const mkdirp = require( 'mkdirp' ).sync;
const path = require( 'path' );
const rimraf = require( 'rimraf' ).sync;
const webpack = require( 'webpack' );

const testDirectory = path.join( __dirname, 'fixtures' );

afterAll( () => rimraf( path.join( __dirname, 'build' ) ) );

describe( 'ReadableJsAssetsWebpackPlugin', () => {
	const outputDirectory = path.join( __dirname, 'build' );

	beforeEach( () => {
		rimraf( outputDirectory );
		mkdirp( outputDirectory );
	} );

	// This afterEach is necessary to prevent watched tests from retriggering on every run.
	afterEach( () => rimraf( outputDirectory ) );

	test( 'should produce the expected output', () =>
		new Promise( ( resolve ) => {
			const options = Object.assign(
				{
					context: testDirectory,
				},
				require( path.join( testDirectory, 'webpack.config.js' ) )
			);
			options.output.path = outputDirectory;

			webpack( options, ( err ) => {
				expect( err ).toBeNull();

				const assetFiles = glob( `${ outputDirectory }/*.js` );

				expect( assetFiles ).toHaveLength( 4 );

				// Asset files should match.
				assetFiles.forEach( ( assetFile ) => {
					expect(
						fs.readFileSync( assetFile, 'utf-8' )
					).toMatchSnapshot( 'Asset file should match snapshot' );
				} );

				resolve();
			} );
		} ) );
} );
