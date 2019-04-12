/**
 * External dependencies
 */
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;
const mkdirp = require( 'mkdirp' ).sync;
const path = require( 'path' );
const rimraf = require( 'rimraf' ).sync;
const webpack = require( 'webpack' );

/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '..' );

describe( 'Build tests', () => {
	afterAll( () => rimraf( path.join( __dirname, 'build' ) ) );

	// jest.setTimeout( 20000 );

	const fixturesPath = path.join( __dirname, 'fixtures' );
	const configFixtures = fs.readdirSync( fixturesPath ).sort();

	configFixtures.forEach( ( configCase ) => {
		describe( configCase, () => {
			const testDirectory = path.join( fixturesPath, configCase );
			const outputDirectory = path.join( __dirname, 'build', configCase );

			beforeAll( () => mkdirp( outputDirectory ) );
			afterAll( () => rimraf( outputDirectory ) );

			test( `${ configCase } should produce expected output`, () =>
				new Promise( ( resolve ) => {
					const options = Object.assign(
						{
							context: testDirectory,
							entry: './index.js',
							mode: 'production',
							optimization: { minimize: false },
							output: {},
						},
						require( path.join( testDirectory, 'webpack.config.js' ) )
					);
					options.output.path = outputDirectory;
					if ( ! options.plugins ) {
						options.plugins = [ new DependencyExtractionWebpackPlugin() ];
					}

					webpack( options, ( err ) => {
						expect( err ).toBeNull();

						const depsFiles = glob( `${ outputDirectory }/*.deps.json` );
						const expectedLength =
							typeof options.entry === 'object' ? Object.keys( options.entry ).length : 1;
						expect( depsFiles ).toHaveLength( expectedLength );

						depsFiles.forEach( ( depsFile ) => {
							expect( require( depsFile ) ).toMatchSnapshot();
						} );
						resolve();
					} );
				} ) );
		} );
	} );
} );
