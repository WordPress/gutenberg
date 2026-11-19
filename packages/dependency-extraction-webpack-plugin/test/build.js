import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import { mkdirpSync } from 'mkdirp';
import { rimrafSync } from 'rimraf';
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
} from 'vitest';
import webpack from 'webpack';

const require = createRequire( import.meta.url );
const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );
const fixturesPath = path.join( currentDirectory, 'fixtures' );
const configFixtures = fs.readdirSync( fixturesPath ).sort();

afterAll( () => rimrafSync( path.join( currentDirectory, 'build' ) ) );

function expectCompilationError( stats ) {
	expect( stats.hasErrors() ).toBe( true );
	expect( stats.toString( { errors: true, all: false } ) ).toMatchSnapshot();
}

/**
 * Lists, for each JavaScript file emitted to a folder, the specifiers its
 * static `import` declarations and its `import()` calls name.
 *
 * @param {string} outputDirectory Folder of an unminified module build.
 * @return {Record<string, { static: string[], dynamic: string[] }>} Specifiers by file and import kind.
 */
function getEmittedImports( outputDirectory ) {
	const specifiers = ( content, pattern ) =>
		[
			...new Set(
				Array.from(
					content.matchAll( pattern ),
					( match ) => match[ 1 ]
				)
			),
		].sort();

	return Object.fromEntries(
		globSync( '**/*.@(js|mjs)', { cwd: outputDirectory } )
			.sort()
			.map( ( file ) => {
				const content = fs.readFileSync(
					path.join( outputDirectory, file ),
					'utf-8'
				);
				return [
					file,
					{
						static: specifiers(
							content,
							/^import\s(?:[^;]*?\sfrom\s)?"([^"]+)";$/gm
						),
						dynamic: specifiers(
							content,
							/\bimport\("([^"]+)"\)/g
						),
					},
				];
			} )
	);
}

function loadWebpackConfig( configPath, defaults ) {
	const config = require( configPath );

	return {
		...defaults,
		...config,
		output: { ...defaults.output, ...config.output },
		experiments: { ...defaults.experiments, ...config.experiments },
	};
}

/**
 * Returns the webpack options that build a fixture as classic scripts or as
 * script modules.
 *
 * @param {string}                configCase      Name of the fixture folder.
 * @param {'scripts' | 'modules'} moduleMode      Kind of output.
 * @param {string}                outputDirectory Folder to emit the build to.
 * @return {webpack.Configuration} Webpack options.
 */
function getFixtureOptions( configCase, moduleMode, outputDirectory ) {
	const testDirectory = path.join( fixturesPath, configCase );
	const options = loadWebpackConfig(
		path.join( testDirectory, 'webpack.config.js' ),
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
		}
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

	return options;
}

/**
 * Compiles a fixture as classic scripts or as script modules.
 *
 * @param {string}                configCase      Name of the fixture folder.
 * @param {'scripts' | 'modules'} moduleMode      Kind of output.
 * @param {string}                outputDirectory Folder to emit the build to.
 * @return {Promise<webpack.Stats>} Stats of the compilation.
 */
function compileFixture( configCase, moduleMode, outputDirectory ) {
	const options = getFixtureOptions(
		configCase,
		moduleMode,
		outputDirectory
	);

	return new Promise( ( resolve, reject ) =>
		webpack( options, ( err, stats ) => {
			if ( err ) {
				return reject( err );
			}
			resolve( stats );
		} )
	);
}

describe.each( /** @type {const} */ ( [ 'scripts', 'modules' ] ) )(
	'DependencyExtractionWebpackPlugin %s',
	( moduleMode ) => {
		describe.each( configFixtures )( 'Webpack `%s`', ( configCase ) => {
			const outputDirectory = path.join(
				currentDirectory,
				'build',
				moduleMode,
				configCase
			);

			beforeEach( () => {
				rimrafSync( outputDirectory );
				mkdirpSync( outputDirectory );
			} );

			// This afterEach is necessary to prevent watched tests from retriggering on every run.
			afterEach( () => rimrafSync( outputDirectory ) );

			test( 'should produce expected output', async () => {
				const stats = await compileFixture(
					configCase,
					moduleMode,
					outputDirectory
				);

				if ( configCase.includes( 'error' ) ) {
					expectCompilationError( stats );
					return;
				}

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

describe( 'DependencyExtractionWebpackPlugin modules emitted imports', () => {
	describe.each(
		configFixtures.filter(
			( configCase ) => ! configCase.includes( 'error' )
		)
	)( 'Webpack `%s`', ( configCase ) => {
		const outputDirectory = path.join(
			currentDirectory,
			'build',
			'modules-emitted-imports',
			configCase
		);

		beforeEach( () => {
			rimrafSync( outputDirectory );
			mkdirpSync( outputDirectory );
		} );

		afterEach( () => rimrafSync( outputDirectory ) );

		test( 'should keep the kind of each import of an external', async () => {
			const stats = await compileFixture(
				configCase,
				'modules',
				outputDirectory
			);

			if ( stats.hasErrors() ) {
				throw new Error(
					stats.toString( { errors: true, all: false } )
				);
			}

			expect( getEmittedImports( outputDirectory ) ).toMatchSnapshot();
		} );
	} );
} );

describe( 'DependencyExtractionWebpackPlugin modules rebuild', () => {
	const configCase = 'wordpress-script-modules';
	const outputDirectory = path.join(
		currentDirectory,
		'build',
		'modules-rebuild',
		configCase
	);

	beforeEach( () => {
		rimrafSync( outputDirectory );
		mkdirpSync( outputDirectory );
	} );

	afterEach( () => rimrafSync( outputDirectory ) );

	test( 'should keep both import kinds of an unchanged file', async () => {
		// Keep the modules in memory between compilations, as watch rebuilds do.
		const compiler = webpack( {
			...getFixtureOptions( configCase, 'modules', outputDirectory ),
			cache: true,
		} );
		const run = () =>
			new Promise( ( resolve, reject ) =>
				compiler.run( ( err, stats ) =>
					err ? reject( err ) : resolve( stats )
				)
			);

		await run();
		const stats = await run();
		await new Promise( ( resolve ) => compiler.close( resolve ) );

		// The second compilation reuses the file's module from the cache.
		const builtFiles = Array.from(
			stats.compilation.builtModules,
			( { resource } ) => resource
		);
		expect( builtFiles ).not.toContain(
			path.join( fixturesPath, configCase, 'both-kinds.js' )
		);
		expect(
			getEmittedImports( outputDirectory )[ 'both-kinds.mjs' ]
		).toEqual( {
			static: [ '@wordpress/a11y' ],
			dynamic: [ '@wordpress/a11y' ],
		} );
	} );
} );

describe.each( /** @type {const} */ ( [ 'scripts', 'modules' ] ) )(
	'DependencyExtractionWebpackPlugin %s asset version',
	( moduleMode ) => {
		const fixtureDirectory = path.join( fixturesPath, 'style-cache-group' );
		const workingDirectory = path.join(
			currentDirectory,
			'build',
			moduleMode,
			'style-cache-group-version'
		);
		const sourceDirectory = path.join( workingDirectory, 'src' );

		beforeEach( () => {
			rimrafSync( workingDirectory );
			mkdirpSync( sourceDirectory );
			for ( const file of [ 'index.js', 'style.css' ] ) {
				fs.copyFileSync(
					path.join( fixtureDirectory, file ),
					path.join( sourceDirectory, file )
				);
			}
		} );

		afterEach( () => rimrafSync( workingDirectory ) );

		const build = async ( outputDirectory ) => {
			const options = loadWebpackConfig(
				path.join( fixtureDirectory, 'webpack.config.js' ),
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
				}
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
