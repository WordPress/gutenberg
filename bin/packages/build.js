#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const ProgressBar = require( 'progress' );
const workerFarm = require( 'worker-farm' );

/**
 * Internal dependencies
 */
const { groupByDepth } = require( './dependency-graph' );
const { V2_PACKAGES } = require( './v2-packages' );

const files = process.argv.slice( 2 );

/**
 * Path to packages directory.
 *
 * @type {string}
 */
const PACKAGES_DIR = path
	.resolve( __dirname, '../../packages' )
	.replace( /\\/g, '/' );

const stylesheetEntryPoints = glob.sync(
	path.resolve( PACKAGES_DIR, '*/src/*.scss' )
);

/**
 * Get the package name for a specified file
 *
 * @param {string} file File name.
 *
 * @return {string} Package name.
 */
function getPackageName( file ) {
	return path.relative( PACKAGES_DIR, file ).split( path.sep )[ 0 ];
}

/**
 * Parses all Sass import statements in a given file
 *
 * @param {string} file File name.
 *
 * @return {Array} List of Import Statements in a file.
 */
function parseImportStatements( file ) {
	const fileContent = fs.readFileSync( file, 'utf8' );
	return fileContent.toString().match( /@import "(.*?)"/g );
}

/**
 * Finds all stylesheet entry points that contain import statements
 * that include the given file name
 *
 * @param {string} file File name.
 *
 * @return {Array} List of entry points that import the styles from the file.
 */
function findStyleEntriesThatImportFile( file ) {
	const packageName = getPackageName( file );
	const regex = new RegExp( `/${ packageName }/`, 'g' );

	const entriesWithImport = stylesheetEntryPoints.reduce(
		( acc, entryPoint ) => {
			const styleEntryImportStatements =
				parseImportStatements( entryPoint );

			const isImported =
				styleEntryImportStatements &&
				styleEntryImportStatements.find( ( importStatement ) =>
					importStatement.match( regex )
				);

			if ( isImported ) {
				acc.push( entryPoint );
			}

			return acc;
		},
		[]
	);

	return entriesWithImport;
}

/**
 * Get all v1 packages (non-v2 packages).
 *
 * @return {string[]} Array of v1 package names.
 */
function getV1Packages() {
	const allPackages = fs
		.readdirSync( PACKAGES_DIR, { withFileTypes: true } )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );

	return allPackages.filter(
		( packageName ) => ! V2_PACKAGES.includes( packageName )
	);
}

/**
 * Main build function.
 */
async function main() {
	let filesToBuild = files;

	// If no specific files provided, collect all files to build
	if ( filesToBuild.length === 0 ) {
		const allFiles = await glob(
			[
				`${ PACKAGES_DIR }/*/src/**/*.{js,ts,tsx}`,
				`${ PACKAGES_DIR }/*/src/*.scss`,
				`${ PACKAGES_DIR }/block-library/src/**/*.js`,
				`${ PACKAGES_DIR }/block-library/src/*/style.scss`,
				`${ PACKAGES_DIR }/block-library/src/*/theme.scss`,
				`${ PACKAGES_DIR }/block-library/src/*/editor.scss`,
				`${ PACKAGES_DIR }/block-library/src/*.scss`,
			],
			{
				ignore: [
					`**/benchmark/**`,
					`**/{__mocks__,__tests__,test}/**`,
					`**/{storybook,stories}/**`,
					`**/e2e-test-utils-playwright/**`,
				],
				onlyFiles: true,
			}
		);

		// Apply transforms
		const transformedFiles = new Set();
		for ( const file of allFiles ) {
			// Style entry transform
			if ( path.extname( file ) === '.scss' ) {
				const packageName = getPackageName( file );
				const entries = await glob(
					path
						.resolve( PACKAGES_DIR, packageName, 'src/*.scss' )
						.replace( /\\/g, '/' )
				);

				// Account for the specific case where block styles in
				// block-library package also need rebuilding.
				if (
					packageName === 'block-library' &&
					[ 'style.scss', 'editor.scss', 'theme.scss' ].includes(
						path.basename( file )
					)
				) {
					entries.push( file );
				}

				entries.forEach( ( entry ) => transformedFiles.add( entry ) );

				// Find other stylesheets that need to be rebuilt because
				// they import the styles that are being transformed.
				const styleEntries = findStyleEntriesThatImportFile( file );
				styleEntries.forEach( ( entry ) =>
					transformedFiles.add( entry )
				);
			} else {
				transformedFiles.add( file );
			}
		}

		filesToBuild = Array.from( transformedFiles );
	}

	// Group files by their package's dependency level
	const v1Packages = getV1Packages();
	const packageLevels = groupByDepth( v1Packages );

	console.log(
		`Building ${ v1Packages.length } v1 packages in ${ packageLevels.length } dependency level(s)...\n`
	);

	const bar = new ProgressBar( 'Build Progress: [:bar] :percent', {
		width: 30,
		incomplete: ' ',
		total: filesToBuild.length,
	} );

	// Build packages level by level
	for ( let i = 0; i < packageLevels.length; i++ ) {
		const packagesInLevel = packageLevels[ i ];
		const filesInLevel = filesToBuild.filter( ( file ) => {
			const packageName = getPackageName( file );
			return packagesInLevel.includes( packageName );
		} );

		if ( filesInLevel.length === 0 ) {
			continue;
		}

		// Track progress
		let completed = 0;
		const levelPromise = new Promise( ( resolve, reject ) => {
			const worker = workerFarm( require.resolve( './build-worker' ) );
			let hasError = false;

			const onComplete = ( error ) => {
				if ( error ) {
					hasError = true;
					console.error( error );
				}

				++completed;
				bar.tick();

				if ( completed === filesInLevel.length ) {
					workerFarm.end( worker );
					if ( hasError ) {
						reject( new Error( 'Build failed with errors' ) );
					} else {
						resolve();
					}
				}
			};

			filesInLevel.forEach( ( file ) => {
				worker( file, onComplete );
			} );
		} );

		await levelPromise;
	}

	console.log( '\n✅ Build complete!' );
}

main().catch( ( error ) => {
	console.error( '\n❌ Build failed:', error );
	process.exit( 1 );
} );
