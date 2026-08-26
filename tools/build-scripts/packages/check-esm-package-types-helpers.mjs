import spawn from 'cross-spawn';

export function publishesBuildTypes( { directory, packageJson } ) {
	const result = spawn.sync(
		'npm',
		[ 'pack', '--dry-run', '--json', '--ignore-scripts' ],
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
			`Package inspection terminated by ${ result.signal } for ${ packageJson.name }`
		);
	}
	if ( result.status !== 0 ) {
		const output = `${ result.stdout }\n${ result.stderr }`.trim();
		throw new Error(
			`Could not inspect published files for ${ packageJson.name }:\n${
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

	return packResults[ 0 ].files.some(
		( file ) =>
			file.path === 'build-types' ||
			file.path.startsWith( 'build-types/' )
	);
}

export function inspectBuildTypesPublications(
	packages,
	inspectPackage = publishesBuildTypes
) {
	return packages.map( ( packageData ) => {
		try {
			return {
				status: 'fulfilled',
				packageData,
				publishesBuildTypes: inspectPackage( packageData ),
			};
		} catch ( reason ) {
			return { status: 'rejected', packageData, reason };
		}
	} );
}
