import {
	access,
	mkdtemp,
	readFile,
	readdir,
	rm,
	writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';
import fastGlob from 'fast-glob';

const rootDirectory = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const packagesDirectory = path.join( rootDirectory, 'packages' );

function getPackageTypeRoots( directory ) {
	const packageRequire = createRequire(
		path.join( directory, 'package.json' )
	);
	const nodeTypesDirectory = path.dirname(
		packageRequire.resolve( '@types/node/package.json' )
	);
	return path.dirname( nodeTypesDirectory );
}

async function publishesBuildTypes( { directory, packageJson } ) {
	if ( packageJson.files ) {
		return packageJson.files.some(
			( file ) =>
				file === 'build-types' || file.startsWith( 'build-types/' )
		);
	}

	try {
		await access( path.join( directory, 'build-types' ) );
		return true;
	} catch ( error ) {
		if ( error.code !== 'ENOENT' ) {
			throw error;
		}
		return false;
	}
}

function pointsOnlyToCss( target ) {
	if ( typeof target === 'string' ) {
		return target.endsWith( '.css' );
	}
	if ( target && typeof target === 'object' ) {
		const targets = Object.values( target ).filter( Boolean );
		return targets.length > 0 && targets.every( pointsOnlyToCss );
	}
	return false;
}

function getCssEntrypoints( packageJson ) {
	return Object.entries( packageJson.exports ?? {} )
		.filter( ( [ , target ] ) => pointsOnlyToCss( target ) )
		.map( ( [ entrypoint ] ) => entrypoint.replace( /^\.\//, '' ) );
}

async function checkNodeNextTypes( { directory, packageJson } ) {
	const declarations = await fastGlob( 'build-types/**/*.d.{ts,mts,cts}', {
		cwd: directory,
		absolute: true,
	} );
	if ( declarations.length === 0 ) {
		throw new Error( `No declarations found for ${ packageJson.name }` );
	}

	const temporaryDirectory = await mkdtemp(
		path.join( tmpdir(), 'gutenberg-esm-types-' )
	);
	const tsconfigPath = path.join( temporaryDirectory, 'tsconfig.json' );
	let result;
	try {
		await writeFile(
			tsconfigPath,
			JSON.stringify( {
				compilerOptions: {
					target: 'esnext',
					module: 'nodenext',
					moduleResolution: 'nodenext',
					noEmit: true,
					pretty: false,
					typeRoots: [ getPackageTypeRoots( directory ) ],
				},
				files: declarations,
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

	const buildTypesPrefix = `${ path
		.relative( rootDirectory, path.join( directory, 'build-types' ) )
		.replaceAll( path.sep, '/' ) }/`;
	const diagnostics = `${ result.stdout }\n${ result.stderr }`.split(
		/\r?\n/
	);
	const hasTypeScriptDiagnostics = diagnostics.some( ( line ) =>
		/error TS\d+:/.test( line )
	);
	// Ignore diagnostics owned by external dependencies. Global compiler errors
	// and errors in this package's published declarations still fail the check.
	const relevantDiagnostics = diagnostics.filter( ( line ) => {
		const normalizedLine = line.replaceAll( '\\', '/' );
		return (
			normalizedLine.startsWith( buildTypesPrefix ) ||
			normalizedLine.startsWith( 'error TS' )
		);
	} );
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

async function getPublishedEsmPackages() {
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
	const buildTypesPublication = await Promise.all(
		publishedEsmPackages.map( async ( packageData ) => ( {
			packageData,
			publishesBuildTypes: await publishesBuildTypes( packageData ),
		} ) )
	);

	for ( const {
		packageData,
		publishesBuildTypes: publishes,
	} of buildTypesPublication ) {
		if ( ! publishes ) {
			console.log(
				`${ packageData.packageJson.name }: Skipping ESM declaration validation because build-types is not published.`
			);
		}
	}

	return buildTypesPublication
		.filter( ( { publishesBuildTypes: publishes } ) => publishes )
		.map( ( { packageData } ) => packageData )
		.sort( ( a, b ) =>
			a.packageJson.name.localeCompare( b.packageJson.name )
		);
}

async function checkPackage( packageData ) {
	const { directory, packageJson } = packageData;
	await checkNodeNextTypes( packageData );

	const args = [
		'--pack',
		directory,
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

let hasErrors = false;
for ( const packageData of await getPublishedEsmPackages() ) {
	try {
		await checkPackage( packageData );
	} catch ( error ) {
		const message =
			error instanceof Error ? error.message : String( error );
		console.error( `${ packageData.packageJson.name }: ${ message }` );
		hasErrors = true;
	}
}

if ( hasErrors ) {
	process.exitCode = 1;
}
