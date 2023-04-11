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
const fs = require( 'fs' );
const path = require( 'path' );
const { exec } = require( 'child_process' );
const chalk = require( 'chalk' );

// Tsconfig can be JSON5, which accepts comments, which need to be stripped so we can parse the JSON.
function stripJsonComments( jsonString ) {
	const lines = jsonString.split( '\n' );
	const cleanedLines = lines.map( ( line ) => line.replace( /\/\/.*$/, '' ) );
	return cleanedLines.join( '\n' );
}

function checkDeclarationFile( file ) {
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

async function checkUnverifiedDeclarationFiles() {
	const packageDir = path.resolve( 'packages' );
	const subDirs = fs
		.readdirSync( packageDir, { withFileTypes: true } )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => path.join( packageDir, dirent.name ) );

	const possibleDeclarations = subDirs.reduce( ( acc, pkg ) => {
		const tsconfigPath = path.join( pkg, 'tsconfig.json' );

		if ( fs.existsSync( tsconfigPath ) ) {
			const tsconfigRaw = fs.readFileSync( tsconfigPath, 'utf-8' );
			const tsconfig = JSON.parse( stripJsonComments( tsconfigRaw ) );

			if ( tsconfig.compilerOptions?.checkJs === false ) {
				acc.push( `${ pkg }/build-types/index.d.ts` );
			}
		}
		return acc;
	}, [] );

	const declarations = possibleDeclarations.filter( ( decFile ) =>
		fs.existsSync( decFile )
	);

	if ( declarations.length !== possibleDeclarations.length ) {
		console.error(
			[
				'The following declaration files are missing, but they should exist:',
				...possibleDeclarations.filter(
					( dec ) => ! declarations.includes( dec )
				),
				'You may need to run tsc again.',
			].join( '\n' )
		);
		process.exit( 1 );
	}

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
