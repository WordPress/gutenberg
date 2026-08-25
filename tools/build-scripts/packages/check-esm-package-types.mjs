import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';

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

function pointsToCss( target ) {
	if ( typeof target === 'string' ) {
		return target.endsWith( '.css' );
	}
	if ( target && typeof target === 'object' ) {
		return Object.values( target ).some( pointsToCss );
	}
	return false;
}

function getCssEntrypoints( packageJson ) {
	return Object.entries( packageJson.exports ?? {} )
		.filter( ( [ , target ] ) => pointsToCss( target ) )
		.map( ( [ entrypoint ] ) => entrypoint.replace( /^\.\//, '' ) );
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

function checkPackage( { directory, packageJson } ) {
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

	return new Promise( ( resolve, reject ) => {
		const child = spawn( 'attw', args, {
			cwd: rootDirectory,
			stdio: 'inherit',
		} );
		child.on( 'error', reject );
		child.on( 'exit', ( code ) => {
			if ( code === 0 ) {
				resolve();
			} else {
				reject(
					new Error(
						`Incorrect published ESM types for ${ packageJson.name }`
					)
				);
			}
		} );
	} );
}

for ( const packageData of await getPublishedEsmPackages() ) {
	await checkPackage( packageData );
}
