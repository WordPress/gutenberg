import path from 'node:path';
import spawn from 'cross-spawn';

export function classifyTypeScriptDiagnostics(
	diagnostics,
	ownedDiagnosticPrefixes
) {
	const hasTypeScriptDiagnostics = diagnostics.some( ( line ) =>
		/error TS\d+:/.test( line )
	);
	const relevantDiagnostics = diagnostics.filter( ( line ) => {
		const normalizedLine = line.replaceAll( '\\', '/' );
		return (
			normalizedLine.startsWith( 'error TS' ) ||
			ownedDiagnosticPrefixes.some( ( prefix ) =>
				normalizedLine.startsWith( prefix )
			)
		);
	} );

	return { hasTypeScriptDiagnostics, relevantDiagnostics };
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

export function getCssEntrypoints( packageJson ) {
	return Object.entries( packageJson.exports ?? {} )
		.filter( ( [ , target ] ) => pointsOnlyToCss( target ) )
		.map( ( [ entrypoint ] ) => entrypoint.replace( /^\.\//, '' ) );
}

export function packPackage( { directory, packageJson }, packDestination ) {
	const result = spawn.sync(
		'npm',
		[
			'pack',
			'--json',
			'--ignore-scripts',
			'--pack-destination',
			packDestination,
		],
		{
			cwd: directory,
			encoding: 'utf8',
		}
	);
	if ( result.error ) {
		throw result.error;
	}
	if ( result.signal ) {
		throw new Error(
			`Package packing terminated by ${ result.signal } for ${ packageJson.name }`
		);
	}
	if ( result.status !== 0 ) {
		const output = `${ result.stdout }\n${ result.stderr }`.trim();
		throw new Error(
			`Could not pack ${ packageJson.name }:\n${
				output || `npm pack exited with status ${ result.status }.`
			}`
		);
	}

	let packResults;
	try {
		packResults = JSON.parse( result.stdout );
	} catch {
		throw new Error(
			`Could not parse packed file list for ${ packageJson.name }.`
		);
	}
	if ( ! Array.isArray( packResults ) || packResults.length !== 1 ) {
		throw new Error(
			`Unexpected packed file list for ${ packageJson.name }.`
		);
	}

	const packResult = packResults[ 0 ];
	const files = packResult.files.map( ( file ) =>
		path.join( directory, file.path )
	);
	return {
		declarations: files.filter( ( filePath ) =>
			/[/\\]build-types[/\\].*\.d\.(?:ts|mts|cts)$/.test( filePath )
		),
		files,
		tarballPath: path.join( packDestination, packResult.filename ),
	};
}

export function inspectPackagePublications(
	packages,
	packDestination,
	inspectPackage = packPackage
) {
	return packages.map( ( packageData ) => {
		try {
			return {
				status: 'fulfilled',
				packageData,
				packedPackage: inspectPackage( packageData, packDestination ),
			};
		} catch ( reason ) {
			return { status: 'rejected', packageData, reason };
		}
	} );
}
