import { readFile } from 'node:fs/promises';
import path from 'node:path';
import spawn from 'cross-spawn';

const declarationSpecifierPattern =
	/(?:\b(?:from|import)\s*\(?\s*|\brequire\s*\(\s*|<reference\s+(?:path|types)=\s*)(['"])(\.\.?\/[^'"]+\.tsx?)\1/g;

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

export async function findInvalidTypeScriptSpecifiers(
	declarations,
	rootDirectory
) {
	const invalidSpecifiers = [];
	for ( const declaration of declarations ) {
		const contents = await readFile( declaration, 'utf8' );
		for ( const match of contents.matchAll(
			declarationSpecifierPattern
		) ) {
			invalidSpecifiers.push( {
				file: path.relative( rootDirectory, declaration ),
				line: contents.slice( 0, match.index ).split( /\r?\n/ ).length,
				specifier: match[ 2 ],
			} );
		}
	}
	return invalidSpecifiers;
}
