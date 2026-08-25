import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';
import fastGlob from 'fast-glob';

const rootDirectory = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const packagesDirectory = path.join( rootDirectory, 'packages' );

function publishesBuildTypes( packageJson ) {
	return packageJson.files?.some(
		( file ) => file === 'build-types' || file.startsWith( 'build-types/' )
	);
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
	const entrypoints = await fastGlob( 'build-types/**/*.d.{ts,mts,cts}', {
		cwd: directory,
		absolute: true,
	} );
	if ( entrypoints.length === 0 ) {
		throw new Error( `No declarations found for ${ packageJson.name }` );
	}
	const result = spawn.sync(
		'tsc',
		[
			'--ignoreConfig',
			'--target',
			'esnext',
			'--module',
			'nodenext',
			'--moduleResolution',
			'nodenext',
			'--noEmit',
			'--pretty',
			'false',
			...entrypoints,
		],
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
			`NodeNext type check terminated by ${ result.signal } for ${ packageJson.name }`
		);
	}

	const buildTypesPrefix = `${ path
		.relative( rootDirectory, path.join( directory, 'build-types' ) )
		.replaceAll( path.sep, '/' ) }/`;
	const diagnostics = `${ result.stdout }\n${ result.stderr }`.split(
		/\r?\n/
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

	return packages
		.filter(
			( packageData ) =>
				packageData &&
				! packageData.packageJson.private &&
				packageData.packageJson.type === 'module' &&
				publishesBuildTypes( packageData.packageJson )
		)
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

for ( const packageData of await getPublishedEsmPackages() ) {
	await checkPackage( packageData );
}
