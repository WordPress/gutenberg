#!/usr/bin/env node
/**
 *
 * Extracts and copies the source files referenced in a source-map file to a target directory.
 *
 * Usage:
 * 	- Extract source files of source-map file:
 * 	  node extract-files-from-sourcemap bundle/ios/App.js.map <PATH>
 */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

const copyFileToDir = ( filePath, targetDir ) => {
	const fileDir = path.dirname( filePath );
	const newDir = path.join( targetDir, fileDir );
	const newFilePath = path.join( newDir, path.basename( filePath ) );

	fs.mkdirSync( newDir, { recursive: true } );
	fs.copyFileSync( filePath, newFilePath );
};

if ( require.main === module ) {
	const mapFile = process.argv[ 2 ];
	const targetDir = process.argv[ 3 ];

	// Validate arguments
	if ( ! mapFile ) {
		// eslint-disable-next-line no-console
		console.error( `Map file argument is required.` );
		process.exit( 1 );
	}
	if ( ! targetDir ) {
		// eslint-disable-next-line no-console
		console.error( `Target directory argument is required.` );
		process.exit( 1 );
	}
	try {
		fs.accessSync( mapFile );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( `Map file "${ mapFile } doesn't exist.` );
		process.exit( 1 );
	}
	try {
		fs.accessSync( targetDir );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.error( `Target directory "${ targetDir }"" doesn't exist.` );
		process.exit( 1 );
	}

	// Get source files from sourcemap file
	const mapFileData = fs.readFileSync( mapFile );
	const { sources } = JSON.parse( mapFileData );

	let sourceFiles = sources;

	// Filter out files under "node_modules" folder
	sourceFiles = sourceFiles.filter(
		( file ) => file.indexOf( 'node_modules' ) === -1
	);

	// Only include source code and JSON files
	sourceFiles = sourceFiles.filter( ( file ) =>
		[ '.js', '.json', '.ts' ].includes( path.extname( file ) )
	);

	// Filter out unexisting files
	sourceFiles = sourceFiles.filter( ( file ) => {
		try {
			fs.accessSync( file );
			return true;
		} catch ( error ) {
			return false;
		}
	} );

	// Use compiled files for Typescript files
	sourceFiles = sourceFiles.map( ( file ) => {
		if ( file.indexOf( 'node_modules' ) === -1 && file.endsWith( '.ts' ) ) {
			const compiledFile = file
				.replace( 'src', 'build' )
				.replace( '.ts', '.js' );
			try {
				fs.accessSync( compiledFile );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.warn(
					`Couldn't find matching build file for Typescript file "${ compiledFile }".`
				);
				return file;
			}

			// eslint-disable-next-line no-console
			console.log(
				`Using compiled file "${ compiledFile }" for Typescript file "${ file }"`
			);
			return compiledFile;
		}
		return file;
	} );

	// Copy source files to target directory
	try {
		sourceFiles.forEach( ( sourceFile ) =>
			copyFileToDir( sourceFile, targetDir )
		);
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error(
			`Something went wrong when copying source files to "${ targetDir }":`,
			error
		);
	}
}
