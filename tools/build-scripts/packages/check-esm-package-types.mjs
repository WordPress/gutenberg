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
const buildSolutionPath = path.join( rootDirectory, 'tsconfig.build.json' );

function showConfig( tsconfigPath, name ) {
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
			`TypeScript config inspection terminated by ${ result.signal } for ${ name }`
		);
	}
	if ( result.status !== 0 ) {
		const output = `${ result.stdout }\n${ result.stderr }`.trim();
		throw new Error(
			`Could not inspect TypeScript config for ${ name }:\n${
				output || `tsc exited with status ${ result.status }.`
			}`
		);
	}

	try {
		return JSON.parse( result.stdout );
	} catch {
		throw new Error( `Could not parse TypeScript config for ${ name }.` );
	}
}

let buildSolutionProjects;

/**
 * Lists the build solution projects that emit this package's declarations.
 * The dev project is never one of them: its test type packages would mask a
 * declaration that only resolves with them.
 *
 * @param {string} directory Package directory.
 * @return {string[]} Project paths, as referenced by `tsconfig.build.json`.
 */
function getBuildProjects( directory ) {
	buildSolutionProjects ??= (
		showConfig( buildSolutionPath, 'tsconfig.build.json' ).references ?? []
	).map( ( reference ) => path.resolve( rootDirectory, reference.path ) );
	return buildSolutionProjects.filter(
		( projectPath ) =>
			projectPath === directory ||
			projectPath.startsWith( directory + path.sep )
	);
}

function getPackageTypeOptions( { buildProjects = [], packageJson } ) {
	if ( buildProjects.length === 0 ) {
		throw new Error(
			`No build project for ${ packageJson.name } in tsconfig.build.json.`
		);
	}
	const typeRoots = new Set();
	const types = new Set();
	for ( const projectPath of buildProjects ) {
		const projectDirectory =
			path.extname( projectPath ) === '.json'
				? path.dirname( projectPath )
				: projectPath;
		const { compilerOptions = {} } = showConfig(
			projectPath,
			packageJson.name
		);
		for ( const typeRoot of compilerOptions.typeRoots ?? [] ) {
			typeRoots.add( path.resolve( projectDirectory, typeRoot ) );
		}
		for ( const type of compilerOptions.types ?? [] ) {
			types.add( type );
		}
	}
	return {
		typeRoots: typeRoots.size > 0 ? [ ...typeRoots ] : undefined,
		types: [ ...types ],
	};
}

export async function checkNodeNextTypes(
	{ directory, packageJson, buildProjects },
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
					...getPackageTypeOptions( { buildProjects, packageJson } ),
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

	const publishedEsmPackages = packages
		.filter(
			( packageData ) =>
				packageData &&
				! packageData.packageJson.private &&
				packageData.packageJson.type === 'module'
		)
		.map( ( packageData ) => ( {
			...packageData,
			buildProjects: getBuildProjects( packageData.directory ),
		} ) );
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
