/**
 * The purpose of this script is to double-check certain published build types.
 * When we translate JSDoc into types that we wish to publish, we occasionally
 * disable the type checker for JS files. Unfortunately, this can result in invalid
 * index.d.ts files being published.
 *
 * This script verifies the publishd index.d.ts file for every package which both
 * builds types and also sets checkJs to false in its tsconfig.json. This is done
 * by running `tsc --noEmit` on the $package/build-types/index.d.ts file. This also
 * verifies everything index.d.ts references, which essentially checks the entire
 * public api of the type declarations for that package.
 *
 * @see https://github.com/WordPress/gutenberg/pull/49650 for more discussion.
 */

/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { exec } = require( 'child_process' );
const chalk = require( 'chalk' );

// Tsconfig can be JSON5, which accepts comments, which need to be stripped so we can parse the JSON.
function stripJsonComments( jsonString ) {
	const lines = jsonString.split( '\n' );
	const cleanedLines = lines.map( ( line ) => line.replace( /\/\/.*$/, '' ) );
	return cleanedLines.join( '\n' );
}

async function checkDeclarationFile( file ) {
	return new Promise( ( resolve, reject ) => {
		exec( `npx tsc --noEmit ${ file }`, ( error, stdout, stderr ) => {
			if ( error ) {
				reject( { file, error, stderr, stdout } );
			} else {
				resolve( { file, stdout } );
			}
		} );
	} );
}

async function readTsConfig( tsconfigPath ) {
	const tsconfigRaw = await fs.readFile( tsconfigPath, 'utf-8' );
	return JSON.parse( stripJsonComments( tsconfigRaw ) );
}

// Returns the path to the build-types declaration file for a package if it exists.
// Throws an error and exits the script otherwise.
async function getDecFile( packagePath ) {
	const decFile = path.join( packagePath, 'build-types', 'index.d.ts' );
	try {
		await fs.access( decFile );
		return decFile;
	} catch ( err ) {
		if ( err.code !== 'ENOENT' ) {
			throw err;
		}
		console.error(
			`This declaration file should exist. You may need to run tsc again: ${ decFile }`
		);
		process.exit( 1 );
	}
}

async function checkUnverifiedDeclarationFiles() {
	const packageDir = path.resolve( 'packages' );
	const subDirs = ( await fs.readdir( packageDir, { withFileTypes: true } ) )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => path.join( packageDir, dirent.name ) );

	const declarations = await Promise.all(
		subDirs.map( async ( pkg ) => {
			const tsconfigPath = path.join( pkg, 'tsconfig.json' );
			try {
				const tsconfig = await readTsConfig( tsconfigPath );

				if ( tsconfig.compilerOptions?.checkJs === false ) {
					return getDecFile( pkg );
				}
			} catch ( error ) {
				if ( error.code !== 'ENOENT' ) {
					throw error;
				}
			}
			return null;
		} )
	).filter( Boolean );

	const tscResults = await Promise.allSettled(
		declarations.map( ( declaration ) =>
			checkDeclarationFile( declaration )
		)
	);

	tscResults.forEach( ( { status, reason } ) => {
		if ( status !== 'fulfilled' ) {
			console.error(
				chalk.red(
					`Incorrect published types for ${ reason.file }:\n`
				),
				reason.stdout
			);
		}
	} );

	if ( tscResults.some( ( { status } ) => status !== 'fulfilled' ) ) {
		process.exit( 1 );
	}
}
checkUnverifiedDeclarationFiles();
