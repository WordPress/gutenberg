#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const ProgressBar = require( 'progress' );
const workerFarm = require( 'worker-farm' );
const { Readable, Transform } = require( 'stream' );

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

function isFileImportedInStyleEntry( file, importStatements ) {
	const packageName = getPackageName( file );
	const regex = new RegExp( `/${ packageName }/`, 'g' );

	return (
		importStatements &&
		importStatements.find( ( importStatement ) =>
			importStatement.match( regex )
		)
	);
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
	const entriesWithImport = stylesheetEntryPoints.reduce(
		( acc, entryPoint ) => {
			const styleEntryImportStatements =
				parseImportStatements( entryPoint );

			if (
				isFileImportedInStyleEntry( file, styleEntryImportStatements )
			) {
				acc.push( entryPoint );
			}

			return acc;
		},
		[]
	);

	return entriesWithImport;
}

/**
 * Returns a stream transform which maps an individual stylesheet to its
 * package entrypoint. Unlike JavaScript which uses an external bundler to
 * efficiently manage rebuilds by entrypoints, stylesheets are rebuilt fresh
 * in their entirety from the build script.
 *
 * @return {Transform} Stream transform instance.
 */
function createStyleEntryTransform() {
	const packages = new Set();

	return new Transform( {
		objectMode: true,
		async transform( file, encoding, callback ) {
			// Only stylesheets are subject to this transform.
			if ( path.extname( file ) !== '.scss' ) {
				this.push( file );
				callback();
				return;
			}

			// Only operate once per package, assuming entries are common.
			const packageName = getPackageName( file );
			if ( packages.has( packageName ) ) {
				callback();
				return;
			}

			packages.add( packageName );
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

			entries.forEach( ( entry ) => this.push( entry ) );

			// Find other stylesheets that need to be rebuilt because
			// they import the styles that are being transformed.
			const styleEntries = findStyleEntriesThatImportFile( file );

			// Rebuild stylesheets that import the styles being transformed.
			if ( styleEntries.length ) {
				styleEntries.forEach( ( entry ) => stream.push( entry ) );
			}

			callback();
		},
	} );
}

/**
 * Returns a stream transform which maps an individual block.json to the
 * index.js that imports it. Presently, babel resolves the import of json
 * files by inlining them as a JavaScript primitive in the importing file.
 * This transform ensures the importing file is rebuilt.
 *
 * @return {Transform} Stream transform instance.
 */
function createBlockJsonEntryTransform() {
	const blocks = new Set();

	return new Transform( {
		objectMode: true,
		async transform( file, encoding, callback ) {
			const matches =
				/block-library[\/\\]src[\/\\](.*)[\/\\]block.json$/.exec(
					file
				);
			const blockName = matches ? matches[ 1 ] : undefined;

			// Only block.json files in the block-library folder are subject to this transform.
			if ( ! blockName ) {
				this.push( file );
				callback();
				return;
			}

			// Only operate once per block, assuming entries are common.
			if ( blockName && blocks.has( blockName ) ) {
				callback();
				return;
			}

			blocks.add( blockName );
			this.push( file.replace( 'block.json', 'index.js' ) );
			callback();
		},
	} );
}

let onFileComplete = () => {};

let stream;

if ( files.length ) {
	stream = new Readable( { encoding: 'utf8' } );
	files.forEach( ( file ) => {
		stream.push( file );
	} );

	stream.push( null );
	stream = stream
		.pipe( createStyleEntryTransform() )
		.pipe( createBlockJsonEntryTransform() );
} else {
	const bar = new ProgressBar( 'Build Progress: [:bar] :percent', {
		width: 30,
		incomplete: ' ',
		total: 1,
	} );

	bar.tick( 0 );

	stream = glob.stream(
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

	// Pause to avoid data flow which would begin on the `data` event binding,
	// but should wait until worker processing below.
	//
	// See: https://nodejs.org/api/stream.html#stream_two_reading_modes
	stream.pause().on( 'data', ( file ) => {
		bar.total = files.push( file );
	} );

	onFileComplete = () => {
		bar.tick();
	};
}

const worker = workerFarm( require.resolve( './build-worker' ) );

let ended = false,
	complete = 0;

stream
	.on( 'data', ( file ) =>
		worker( file, ( error ) => {
			onFileComplete();

			if ( error ) {
				// If an error occurs, the process can't be ended immediately since
				// other workers are likely pending. Optimally, it would end at the
				// earliest opportunity (after the current round of workers has had
				// the chance to complete), but this is not made directly possible
				// through `worker-farm`. Instead, ensure at least that when the
				// process does exit, it exits with a non-zero code to reflect the
				// fact that an error had occurred.
				process.exitCode = 1;

				console.error( error );
			}

			++complete;
			if ( ended && complete === files.length ) {
				workerFarm.end( worker );
			}
		} )
	)
	.on( 'end', () => ( ended = true ) )
	.resume();
