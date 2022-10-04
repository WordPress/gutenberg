/**
 * External dependencies
 */
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;
const mkdirp = require( 'mkdirp' ).sync;
const path = require( 'path' );
const rimraf = require( 'rimraf' ).sync;
const webpack = require( 'webpack' );

jest.useRealTimers();

describe( 'ReadableJsAssetsWebpackPlugin', () => {
	const outputDirectory = path.join( __dirname, 'build' );
	const testDirectory = path.join( __dirname, 'fixtures' );

	beforeEach( () => {
		rimraf( outputDirectory );
		mkdirp( outputDirectory );
	} );

	// This afterEach is necessary to prevent watched tests from retriggering on every run.
	afterEach( () => rimraf( outputDirectory ) );

	test( 'should produce the expected output', async () => {
		await new Promise( ( resolve ) => {
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
					).toMatchSnapshot(
						`Asset file ${ path.relative(
							outputDirectory,
							assetFile
						) } should match snapshot`
					);
				} );

				resolve();
			} );
		} );
	} );
} );
