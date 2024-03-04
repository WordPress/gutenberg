/**
 * This script verifies the published index.d.ts file for every package which both
 * builds types and also sets checkJs to false in its tsconfig.json. (This scenario
 * can cause unchecked errors in JS files to be included in the compiled types.)
 *
 * We do so by running `tsc --noEmit` on the $package/build-types/index.d.ts file.
 * This also verifies everything index.d.ts references, so it checks the entire
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

/**
 * Returns whether a package needs its compiled types to be double-checked. This
 * needs to happen when both of these are true:
 * 1. The package compiles types. (It has a tsconfig file.)
 * 2. The tsconfig sets checkJs to false.
 *
 * NOTE: In the future, if we run into issues parsing JSON, we should migrate to
 * a proper json5 parser, such as the json5 npm package. The current regex just
 * handles comments, which at the time is the only thing we use from JSON5.
 *
 * @param {string} packagePath Path to the package.
 * @return {boolean} whether or not the package checksJs.
 */
async function packageNeedsExtraCheck( packagePath ) {
	const configPath = path.join( packagePath, 'tsconfig.json' );

	try {
		const tsconfigRaw = await fs.readFile( configPath, 'utf-8' );
		// Removes comments from the JSON5 string to convert it to plain JSON.
		const jsonString = tsconfigRaw.replace( /\s+\/\/.*$/gm, '' );
		const config = JSON.parse( jsonString );

		// If checkJs both exists and is false, then we need the extra check.
		return config.compilerOptions?.checkJs === false;
	} catch ( e ) {
		if ( e.code !== 'ENOENT' ) {
			throw e;
		}

		// No tsconfig means no checkJs
		return false;
	}
}

// Returns the path to the build-types declaration file for a package if it exists.
// Throws an error and exits the script otherwise.
async function getDecFile( packagePath ) {
	const decFile = path.join( packagePath, 'build-types', 'index.d.ts' );
	try {
		await fs.access( decFile );
		return decFile;
	} catch ( err ) {
		console.error(
			`Cannot access this declaration file. You may need to run tsc again: ${ decFile }`
		);
		process.exit( 1 );
	}
}

async function typecheckDeclarations( file ) {
	return new Promise( ( resolve, reject ) => {
		exec(
			`npx tsc --target esnext --moduleResolution node --noEmit ${ file }`,
			( error, stdout, stderr ) => {
				if ( error ) {
					reject( { file, error, stderr, stdout } );
				} else {
					resolve( { file, stdout } );
				}
			}
		);
	} );
}

async function checkUnverifiedDeclarationFiles() {
	const packageDir = path.resolve( 'packages' );
	const packageDirs = (
		await fs.readdir( packageDir, { withFileTypes: true } )
	)
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => path.join( packageDir, dirent.name ) );

	// Finds the compiled type declarations for each package which both checks
	// types and has checkJs disabled.
	const declarations = (
		await Promise.all(
			packageDirs.map( async ( pkg ) =>
				( await packageNeedsExtraCheck( pkg ) )
					? getDecFile( pkg )
					: null
			)
		)
	).filter( Boolean );

	const tscResults = await Promise.allSettled(
		declarations.map( typecheckDeclarations )
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
