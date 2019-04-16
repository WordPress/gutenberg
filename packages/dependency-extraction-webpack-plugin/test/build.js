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

const fixturesPath = path.join( __dirname, 'fixtures' );
const configFixtures = fs.readdirSync( fixturesPath ).sort();

afterAll( () => rimraf( path.join( __dirname, 'build' ) ) );

configFixtures.forEach( ( configCase ) => {
	describe( `Webpack ${ configCase }`, () => {
		const testDirectory = path.join( fixturesPath, configCase );
		const outputDirectory = path.join( __dirname, 'build', configCase );

		beforeAll( () => {
			rimraf( outputDirectory );
			mkdirp( outputDirectory );
		} );
		afterAll( () => rimraf( outputDirectory ) );

		test( 'should produce expected output', () =>
			new Promise( ( resolve ) => {
				const options = Object.assign(
					{
						context: testDirectory,
						entry: './index.js',
						mode: 'production',
						optimization: {
							minimize: false,
							namedChunks: true,
							namedModules: true,
						},
						output: {},
					},
					require( path.join( testDirectory, 'webpack.config.js' ) )
				);
				options.output.path = outputDirectory;
				if ( ! options.plugins ) {
					options.plugins = [ new DependencyExtractionWebpackPlugin() ];
				}

				webpack( options, ( err, stats ) => {
					expect( err ).toBeNull();

					const depsFiles = glob( `${ outputDirectory }/*.deps.json` );
					const expectedLength =
						typeof options.entry === 'object' ? Object.keys( options.entry ).length : 1;
					expect( depsFiles ).toHaveLength( expectedLength );

					// Deps files should match
					depsFiles.forEach( ( depsFile ) => {
						expect( require( depsFile ) ).toMatchSnapshot(
							'Dependencies JSON should match snapshot'
						);
					} );

					// Webpack stats external modules should match
					const externalModules = stats.compilation.modules
						.filter( ( { external } ) => external )
						.sort()
						.map( ( module ) => ( {
							externalType: module.externalType,
							request: module.request,
							userRequest: module.userRequest,
						} ) );
					expect( externalModules ).toMatchSnapshot( 'External modules should match snapshot' );

					resolve();
				} );
			} ) );
	} );
} );
