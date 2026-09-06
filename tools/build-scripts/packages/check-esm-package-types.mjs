import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	readdir,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';
import {
	classifyTypeScriptDiagnostics,
	getCssEntrypoints,
	inspectPackagePublications,
} from './check-esm-package-types-helpers.mjs';

const rootDirectory = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const packagesDirectory = path.join( rootDirectory, 'packages' );

function getPackageTypeOptions( { directory, packageJson } ) {
	const tsconfigPath = path.join( directory, 'tsconfig.build.json' );
	const result = spawn.sync(
		'tsc',
		[ '--showConfig', '--project', tsconfigPath ],
		{
			cwd: rootDirectory,
			encoding: 'utf8',
		}
	);
	if ( result.error ) {
		throw result.error;
	}
	if ( result.signal ) {
		throw new Error(
			`TypeScript config inspection terminated by ${ result.signal } for ${ packageJson.name }`
		);
	}
	if ( result.status !== 0 ) {
		const output = `${ result.stdout }\n${ result.stderr }`.trim();
		throw new Error(
			`Could not inspect TypeScript config for ${ packageJson.name }:\n${
				output || `tsc exited with status ${ result.status }.`
			}`
		);
	}

	try {
		const { typeRoots, types = [] } =
			JSON.parse( result.stdout ).compilerOptions ?? {};
		return {
			typeRoots: typeRoots?.map( ( typeRoot ) =>
				path.resolve( directory, typeRoot )
			),
			types,
		};
	} catch {
		throw new Error(
			`Could not parse TypeScript config for ${ packageJson.name }.`
		);
	}
}

export async function checkNodeNextTypes(
	{ directory, packageJson },
	packedPackage
) {
	const { declarations, files } = packedPackage;
	if ( declarations.length === 0 ) {
		throw new Error( `No declarations found for ${ packageJson.name }` );
	}
	const temporaryDirectory = await mkdtemp(
		path.join( directory, '.gutenberg-esm-types-' )
	);
	const mirroredPackageDirectory = path.join( temporaryDirectory, 'package' );
	const getMirroredPath = ( filePath ) =>
		path.join(
			mirroredPackageDirectory,
			path.relative( directory, filePath )
		);
	const mirroredDeclarations = declarations.map( getMirroredPath );
	const tsconfigPath = path.join( temporaryDirectory, 'tsconfig.json' );
	let result;
	try {
		await Promise.all(
			files.map( async ( filePath ) => {
				const mirroredPath = getMirroredPath( filePath );
				await mkdir( path.dirname( mirroredPath ), {
					recursive: true,
				} );
				await copyFile( filePath, mirroredPath );
			} )
		);
		await writeFile(
			tsconfigPath,
			JSON.stringify( {
				compilerOptions: {
					...getPackageTypeOptions( { directory, packageJson } ),
					target: 'esnext',
					module: 'nodenext',
					moduleResolution: 'nodenext',
					noEmit: true,
					pretty: false,
				},
				files: mirroredDeclarations,
			} )
		);
		result = spawn.sync( 'tsc', [ '--project', tsconfigPath ], {
			cwd: rootDirectory,
			encoding: 'utf8',
		} );
	} finally {
		await rm( temporaryDirectory, { recursive: true, force: true } );
	}
	if ( result.error ) {
		throw result.error;
	}
	if ( result.signal ) {
		throw new Error(
			`NodeNext type check terminated by ${ result.signal } for ${ packageJson.name }`
		);
	}

	const buildTypesDirectory = path.join(
		mirroredPackageDirectory,
		'build-types'
	);
	const buildTypesPrefix = `${ path
		.relative( rootDirectory, buildTypesDirectory )
		.replaceAll( path.sep, '/' ) }/`;
	const diagnostics = `${ result.stdout }\n${ result.stderr }`.split(
		/\r?\n/
	);
	// Ignore diagnostics owned by external dependencies. Global compiler errors
	// and errors in the generated config or this package's declarations still
	// fail the check.
	const { hasTypeScriptDiagnostics, relevantDiagnostics } =
		classifyTypeScriptDiagnostics( diagnostics, [
			buildTypesPrefix,
			`${ buildTypesDirectory.replaceAll( path.sep, '/' ) }/`,
			path
				.relative( rootDirectory, tsconfigPath )
				.replaceAll( path.sep, '/' ),
			tsconfigPath.replaceAll( path.sep, '/' ),
		] );
	if ( relevantDiagnostics.length > 0 ) {
		throw new Error(
			`Incorrect NodeNext types for ${
				packageJson.name
			}:\n${ relevantDiagnostics.join( '\n' ) }`
		);
	}
	if ( result.status !== 0 && ! hasTypeScriptDiagnostics ) {
		const output = `${ result.stdout }\n${ result.stderr }`.trim();
		throw new Error(
			`NodeNext type check failed for ${ packageJson.name }:\n${
				output || `tsc exited with status ${ result.status }.`
			}`
		);
	}
	console.log( `${ packageJson.name }: NodeNext declarations valid.` );
}

async function getPublishedEsmPackages( packDestination ) {
	const packageDirectories = await readdir( packagesDirectory, {
		withFileTypes: true,
	} );
	const packages = await Promise.all(
		packageDirectories
			.filter( ( entry ) => entry.isDirectory() )
			.map( async ( entry ) => {
				const directory = path.join( packagesDirectory, entry.name );
				try {
					const packageJson = JSON.parse(
						await readFile(
							path.join( directory, 'package.json' ),
							'utf8'
						)
					);
					return { directory, packageJson };
				} catch ( error ) {
					if ( error.code === 'ENOENT' ) {
						return null;
					}
					throw error;
				}
			} )
	);

	const publishedEsmPackages = packages.filter(
		( packageData ) =>
			packageData &&
			! packageData.packageJson.private &&
			packageData.packageJson.type === 'module'
	);
	const packagePublications = inspectPackagePublications(
		publishedEsmPackages.sort( ( a, b ) =>
			a.packageJson.name.localeCompare( b.packageJson.name )
		),
		packDestination
	);

	for ( const publication of packagePublications ) {
		if (
			publication.status === 'fulfilled' &&
			publication.packedPackage.declarations.length === 0
		) {
			console.log(
				`${ publication.packageData.packageJson.name }: Skipping ESM declaration validation because build-types declarations are not published.`
			);
		}
	}

	return packagePublications.filter(
		( publication ) =>
			publication.status === 'rejected' ||
			publication.packedPackage.declarations.length > 0
	);
}

async function checkPackage( { packageData, packedPackage } ) {
	const { packageJson } = packageData;
	await checkNodeNextTypes( packageData, packedPackage );

	const args = [
		packedPackage.tarballPath,
		'--profile',
		'esm-only',
		'--no-summary',
		'--no-color',
	];
	const cssEntrypoints = getCssEntrypoints( packageJson );
	if ( cssEntrypoints.length > 0 ) {
		// TypeScript does not resolve non-code assets, so ATTW cannot analyze
		// CSS-only exports. Package-content validation covers those files.
		args.push( '--exclude-entrypoints', ...cssEntrypoints );
	}

	// ATTW uses its bundled TypeScript version for the compatibility matrix.
	// The NodeNext check above uses Gutenberg's installed compiler.
	const result = spawn.sync( 'attw', args, {
		cwd: rootDirectory,
		stdio: 'inherit',
	} );
	if ( result.error ) {
		throw result.error;
	}
	if ( result.status !== 0 ) {
		throw new Error(
			`Incorrect published ESM types for ${ packageJson.name }`
		);
	}
}

async function run() {
	const packageArchivesDirectory = await mkdtemp(
		path.join( tmpdir(), 'gutenberg-esm-package-archives-' )
	);
	let hasErrors = false;
	try {
		for ( const publication of await getPublishedEsmPackages(
			packageArchivesDirectory
		) ) {
			const { packageData } = publication;
			try {
				if ( publication.status === 'rejected' ) {
					throw publication.reason;
				}
				await checkPackage( publication );
			} catch ( error ) {
				const message =
					error instanceof Error ? error.message : String( error );
				console.error(
					`${ packageData.packageJson.name }: ${ message }`
				);
				hasErrors = true;
			}
		}
	} finally {
		await rm( packageArchivesDirectory, { recursive: true, force: true } );
	}

	if ( hasErrors ) {
		process.exitCode = 1;
	}
}

if (
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) === fileURLToPath( import.meta.url )
) {
	run().catch( ( error ) => {
		console.error( error );
		process.exitCode = 1;
	} );
}
