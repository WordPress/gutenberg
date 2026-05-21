const fs = require( 'fs' ).promises;
const path = require( 'path' );
const { exec } = require( 'child_process' );
const chalk = require( 'chalk' );

async function packageNeedsExtraCheck( packagePath ) {
	const configPath = path.join( packagePath, 'tsconfig.json' );

	try {
		const tsconfigRaw = await fs.readFile( configPath, 'utf-8' );
		const jsonString = tsconfigRaw.replace( /\s+\/\/.*$/gm, '' );
		const config = JSON.parse( jsonString );

		return config.compilerOptions?.checkJs === false;
	} catch ( e ) {
		if ( e.code !== 'ENOENT' ) {
			throw e;
		}

		return false;
	}
}

async function getDecFile( packagePath ) {
	const decFile = path.join( packagePath, 'build-types', 'index.d.ts' );
	try {
		await fs.access( decFile );
		return decFile;
	} catch {
		console.error(
			`Cannot access this declaration file. You may need to run tsc again: ${ decFile }`
		);
		process.exit( 1 );
	}
}

async function typecheckDeclarations( file ) {
	return new Promise( ( resolve, reject ) => {
		exec(
			`npx tsgo --ignoreConfig --target esnext --moduleResolution bundler --noEmit --skipLibCheck "${ file }"`,
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
				reason.stderr || reason.stdout
			);
		}
	} );

	if ( tscResults.some( ( { status } ) => status !== 'fulfilled' ) ) {
		process.exit( 1 );
	}
}
checkUnverifiedDeclarationFiles();
