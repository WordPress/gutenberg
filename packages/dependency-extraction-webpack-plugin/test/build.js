/**
 * External dependencies
 */
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;
const mkdirp = require( 'mkdirp' ).sync;
const path = require( 'path' );
const rimraf = require( 'rimraf' ).sync;
const webpack = require( 'webpack' );

const fixturesPath = path.join( __dirname, 'fixtures' );
const configFixtures = fs.readdirSync( fixturesPath ).sort();

jest.useRealTimers();

describe( 'DependencyExtractionWebpackPlugin', () => {
	afterAll( () => rimraf( path.join( __dirname, 'build' ) ) );

	describe.each( configFixtures )( 'Webpack `%s`', ( configCase ) => {
		const testDirectory = path.join( fixturesPath, configCase );
		const outputDirectory = path.join( __dirname, 'build', configCase );

		beforeEach( () => {
			rimraf( outputDirectory );
			mkdirp( outputDirectory );
		} );

		// This afterEach is necessary to prevent watched tests from retriggering on every run.
		afterEach( () => rimraf( outputDirectory ) );

		test( 'should produce expected output', () =>
			new Promise( ( resolve ) => {
				const options = Object.assign(
					{
						context: testDirectory,
						entry: './index.js',
						mode: 'production',
						optimization: {
							minimize: false,
							chunkIds: 'named',
							moduleIds: 'named',
						},
						output: {},
					},
					require( path.join( testDirectory, 'webpack.config.js' ) )
				);
				options.output.path = outputDirectory;

				webpack( options, ( err, stats ) => {
					expect( err ).toBeNull();

					const assetFiles = glob(
						`${ outputDirectory }/+(*.asset|assets).@(json|php)`
					);
					const hasCombinedAssets = ( options.plugins || [] ).some(
						( plugin ) => !! ( plugin.options || {} ).combineAssets
					);
					const entrypointCount =
						typeof options.entry === 'object'
							? Object.keys( options.entry ).length
							: 1;
					const expectedLength = hasCombinedAssets
						? 1
						: entrypointCount;
					expect( assetFiles ).toHaveLength( expectedLength );

					// Asset files should match.
					assetFiles.forEach( ( assetFile ) => {
						const assetBasename = path.basename( assetFile );

						expect(
							fs.readFileSync( assetFile, 'utf-8' )
						).toMatchSnapshot(
							`Asset file '${ assetBasename }' should match snapshot`
						);
					} );

					const compareByModuleIdentifier = ( m1, m2 ) => {
						const i1 = m1.identifier();
						const i2 = m2.identifier();
						if ( i1 < i2 ) return -1;
						if ( i1 > i2 ) return 1;
						return 0;
					};

					// Webpack stats external modules should match.
					const externalModules = Array.from(
						stats.compilation.modules
					)
						.filter( ( { externalType } ) => externalType )
						.sort( compareByModuleIdentifier )
						.map( ( module ) => ( {
							externalType: module.externalType,
							request: module.request,
							userRequest: module.userRequest,
						} ) );
					expect( externalModules ).toMatchSnapshot(
						'External modules should match snapshot'
					);

					resolve();
				} );
			} ) );
	} );
} );
