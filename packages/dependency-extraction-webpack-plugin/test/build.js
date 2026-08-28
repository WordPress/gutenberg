const fs = require( 'fs' );
const path = require( 'path' );
const { globSync } = require( 'glob' );
const mkdirp = require( 'mkdirp' ).mkdirp.sync;
const rimraf = require( 'rimraf' ).sync;
const webpack = require( 'webpack' );

const fixturesPath = path.join( __dirname, 'fixtures' );
const configFixtures = fs.readdirSync( fixturesPath ).sort();

afterAll( () => rimraf( path.join( __dirname, 'build' ) ) );

describe.each( /** @type {const} */ ( [ 'scripts', 'modules' ] ) )(
	'DependencyExtractionWebpackPlugin %s',
	( moduleMode ) => {
		describe.each( configFixtures )( 'Webpack `%s`', ( configCase ) => {
			const testDirectory = path.join( fixturesPath, configCase );
			const outputDirectory = path.join(
				__dirname,
				'build',
				moduleMode,
				configCase
			);

			beforeEach( () => {
				rimraf( outputDirectory );
				mkdirp( outputDirectory );
			} );

			// This afterEach is necessary to prevent watched tests from retriggering on every run.
			afterEach( () => rimraf( outputDirectory ) );

			test( 'should produce expected output', async () => {
				const options = Object.assign(
					{
						name: `${ configCase }-${ moduleMode }`,
						target: 'web',
						context: testDirectory,
						entry: './index.js',
						mode: 'production',
						optimization: {
							minimize: false,
							chunkIds: 'named',
							moduleIds: 'named',
						},
						output: {},
						experiments: {},
					},
					require( path.join( testDirectory, 'webpack.config.js' ) )
				);
				options.output.path = outputDirectory;

				if ( moduleMode === 'modules' ) {
					options.target = 'es2024';
					options.output.module = true;
					options.output.chunkFormat = 'module';
					options.output.library = options.output.library || {};
					options.output.library.type = 'module';
					options.experiments.outputModule = true;
				}

				/** @type {webpack.Stats} */
				const stats = await new Promise( ( resolve, reject ) =>
					webpack( options, ( err, _stats ) => {
						if ( err ) {
							return reject( err );
						}
						resolve( _stats );
					} )
				);

				/* eslint-disable jest/no-conditional-expect */
				if ( configCase.includes( 'error' ) ) {
					expect( stats.hasErrors() ).toBe( true );
					expect(
						stats.toString( { errors: true, all: false } )
					).toMatchSnapshot();
					return;
				}
				/* eslint-enable jest/no-conditional-expect */

				if ( stats.hasErrors() ) {
					throw new Error(
						stats.toString( { errors: true, all: false } )
					);
				}

				const assetFiles = globSync( '+(*.asset|assets).@(json|php)', {
					cwd: outputDirectory,
					absolute: true,
				} ).sort();

				expect( assetFiles.length ).toBeGreaterThan( 0 );

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
					if ( i1 < i2 ) {
						return -1;
					}
					if ( i1 > i2 ) {
						return 1;
					}
					return 0;
				};

				// Webpack stats external modules should match.
				const externalModules = Array.from( stats.compilation.modules )
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
			} );
		} );
	}
);

describe.each( /** @type {const} */ ( [ 'scripts', 'modules' ] ) )(
	'DependencyExtractionWebpackPlugin %s asset version',
	( moduleMode ) => {
		const fixtureDirectory = path.join( fixturesPath, 'style-cache-group' );
		const workingDirectory = path.join(
			__dirname,
			'build',
			moduleMode,
			'style-cache-group-version'
		);
		const sourceDirectory = path.join( workingDirectory, 'src' );

		beforeEach( () => {
			rimraf( workingDirectory );
			mkdirp( sourceDirectory );
			for ( const file of [ 'index.js', 'style.css' ] ) {
				fs.copyFileSync(
					path.join( fixtureDirectory, file ),
					path.join( sourceDirectory, file )
				);
			}
		} );

		afterEach( () => rimraf( workingDirectory ) );

		const build = async ( outputDirectory ) => {
			const options = Object.assign(
				{
					name: `style-cache-group-version-${ moduleMode }`,
					target: 'web',
					context: sourceDirectory,
					entry: './index.js',
					mode: 'production',
					optimization: {
						minimize: false,
						chunkIds: 'named',
						moduleIds: 'named',
					},
					output: {},
					experiments: {},
				},
				require( path.join( fixtureDirectory, 'webpack.config.js' ) )
			);
			options.output.path = outputDirectory;

			if ( moduleMode === 'modules' ) {
				options.target = 'es2024';
				options.output.module = true;
				options.output.chunkFormat = 'module';
				options.output.library = options.output.library || {};
				options.output.library.type = 'module';
				options.experiments.outputModule = true;
			}

			/** @type {webpack.Stats} */
			const stats = await new Promise( ( resolve, reject ) =>
				webpack( options, ( err, _stats ) => {
					if ( err ) {
						return reject( err );
					}
					resolve( _stats );
				} )
			);

			if ( stats.hasErrors() ) {
				throw new Error(
					stats.toString( { errors: true, all: false } )
				);
			}

			const assetFile = path.join( outputDirectory, 'main.asset.php' );
			const content = fs.readFileSync( assetFile, 'utf-8' );
			const version = content.match( /'version' => '(\w+)'/ )[ 1 ];

			return { content, version };
		};

		test( 'changes when only imported styles change', async () => {
			const assetA = await build(
				path.join( workingDirectory, 'build-a' )
			);
			const assetB = await build(
				path.join( workingDirectory, 'build-b' )
			);

			// A rebuild without changes produces the same version.
			expect( assetB.content ).toBe( assetA.content );

			fs.writeFileSync(
				path.join( sourceDirectory, 'style.css' ),
				'body {\n\tcolor: #000;\n}\n'
			);

			const assetC = await build(
				path.join( workingDirectory, 'build-c' )
			);

			// A style-only change produces a new version…
			expect( assetC.version ).not.toBe( assetA.version );
			// …and changes nothing else in the asset file.
			expect( assetC.content.replace( assetC.version, '' ) ).toBe(
				assetA.content.replace( assetA.version, '' )
			);
		} );
	}
);
